const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { createServer } = require('node:http');

const projectRoot = path.resolve(__dirname, '..');
const webDir = path.join(projectRoot, 'apps', 'web');
const apiDir = path.join(projectRoot, 'apps', 'api');
const apiDistPath = path.join(apiDir, 'dist', 'index.js');
const nextBuildDir = path.join(webDir, '.next');

// Load environment variables from .env if present
try {
  const dotenv = require('dotenv');
  dotenv.config({ path: path.join(projectRoot, '.env') });
} catch (_) {}

// Ensure JWT_SECRET is set before loading API routes in production
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'super-secret-key-for-dev' || process.env.JWT_SECRET.length < 32) {
  process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('[start] Warning: No secure JWT_SECRET environment variable provided. Generated a secure runtime fallback.');
}

// On Linux / PaaS containers (Node 22 / Alpine / Debian with OpenSSL 3.0),
// configure Prisma to use the OpenSSL 3.0 query engine instead of failing on missing OpenSSL 1.1
if (process.platform === 'linux') {
  const prismaClientDir = path.join(projectRoot, 'node_modules', '.prisma', 'client');
  const musl3Engine = path.join(prismaClientDir, 'libquery_engine-linux-musl-openssl-3.0.x.so.node');
  const debian3Engine = path.join(prismaClientDir, 'libquery_engine-debian-openssl-3.0.x.so.node');

  let isMusl = false;
  try {
    const ldd = require('node:child_process').execSync('ldd --version 2>&1 || true').toString();
    isMusl = ldd.includes('musl');
  } catch (_) {}

  if (isMusl && fs.existsSync(musl3Engine)) {
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = musl3Engine;
    console.log('[start] Selected Prisma engine for Alpine/musl (OpenSSL 3.0):', musl3Engine);
  } else if (!isMusl && fs.existsSync(debian3Engine)) {
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = debian3Engine;
    console.log('[start] Selected Prisma engine for Debian/glibc (OpenSSL 3.0):', debian3Engine);
  }

  // Symlink fallback for legacy binaries looking for libssl.so.1.1
  try {
    const ssl3Candidates = ['/usr/lib/libssl.so.3', '/lib/libssl.so.3', '/usr/local/lib/libssl.so.3', '/usr/lib64/libssl.so.3'];
    const crypto3Candidates = ['/usr/lib/libcrypto.so.3', '/lib/libcrypto.so.3', '/usr/local/lib/libcrypto.so.3', '/usr/lib64/libcrypto.so.3'];
    const foundSsl3 = ssl3Candidates.find(p => fs.existsSync(p));
    const foundCrypto3 = crypto3Candidates.find(p => fs.existsSync(p));

    if (foundSsl3 && foundCrypto3) {
      const fallbackDir = '/tmp/prisma_libssl';
      if (!fs.existsSync(fallbackDir)) fs.mkdirSync(fallbackDir, { recursive: true });
      const fakeSsl11 = path.join(fallbackDir, 'libssl.so.1.1');
      const fakeCrypto11 = path.join(fallbackDir, 'libcrypto.so.1.1');
      if (!fs.existsSync(fakeSsl11)) fs.symlinkSync(foundSsl3, fakeSsl11);
      if (!fs.existsSync(fakeCrypto11)) fs.symlinkSync(foundCrypto3, fakeCrypto11);

      process.env.LD_LIBRARY_PATH = process.env.LD_LIBRARY_PATH
        ? `${fallbackDir}:${process.env.LD_LIBRARY_PATH}`
        : fallbackDir;
    }
  } catch (_) {}
}

// Resolve port / socket correctly for GoDaddy & Phusion Passenger
const rawPort = process.env.PORT || 3000;
const isNumericPort = /^\d+$/.test(String(rawPort).trim());
const numericPort = isNumericPort ? parseInt(String(rawPort).trim(), 10) : 3000;

async function start() {
  // GoDaddy Node.js hosting provides one public application port. Mount the
  // API and Next.js on the same HTTP server instead of binding a separate port.
  delete process.env.API_INTERNAL_URL;

  // Auto-build if build artifacts are missing (e.g. deployed from git where dist/.next are ignored)
  if (!fs.existsSync(apiDistPath) || !fs.existsSync(nextBuildDir)) {
    console.log('[start] Production build artifacts not found. Running "npm run build"...');
    try {
      const { execSync } = require('node:child_process');
      execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });
      console.log('[start] Build completed successfully.');
    } catch (buildError) {
      console.error('[start] Auto-build failed:', buildError.message);
      throw new Error('Build artifacts missing and automatic build failed. Please run "npm run build" manually.');
    }
  }

  // If DATABASE_URL is present, automatically run migrations and initial seed if database is empty
  if (process.env.DATABASE_URL) {
    try {
      console.log('[start] Checking database migrations (prisma migrate deploy)...');
      const { execSync } = require('node:child_process');
      execSync('npx prisma migrate deploy', { cwd: projectRoot, stdio: 'inherit' });
    } catch (migErr) {
      console.warn('[start] Database migration notice:', migErr.message);
    }

    try {
      const { prisma } = require(path.join(projectRoot, 'apps', 'api', 'dist', 'lib', 'prisma.js'));
      const productCount = await prisma.product.count();
      if (productCount === 0) {
        console.log('[start] Fresh database detected (0 products). Seeding starter products and categories...');
        const { execSync } = require('node:child_process');
        execSync('npm run db:seed', { cwd: projectRoot, stdio: 'inherit' });
        console.log('[start] Starter products seeded successfully.');
      }
    } catch (seedErr) {
      console.warn('[start] Database seed notice:', seedErr.message);
    }
  }

  const next = require(require.resolve('next', { paths: [webDir] }));
  const { apiApp, startWhatsAppQueue } = require(apiDistPath);

  const nextApp = next({
    dev: false,
    dir: webDir,
    hostname: isNumericPort ? '0.0.0.0' : undefined,
    port: isNumericPort ? numericPort : undefined,
  });

  await nextApp.prepare();
  const handleNext = nextApp.getRequestHandler();

  const server = createServer(async (req, res) => {
    try {
      const pathname = (req.url || '/').split('?', 1)[0];
      const isApiRequest = pathname === '/api' || pathname.startsWith('/api/') || pathname === '/webhook' || pathname.startsWith('/webhook/') || pathname === '/health';
      if (isApiRequest) {
        apiApp(req, res, (err) => {
          if (err) {
            console.error('[API error]', err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Internal Server Error' }));
            }
            return;
          }
          handleNext(req, res);
        });
        return;
      }
      await handleNext(req, res);
    } catch (err) {
      console.error('[Server error]', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }
  });

  server.on('error', error => {
    console.error('[start] HTTP server error:', error.message);
    process.exitCode = 1;
  });

  if (isNumericPort) {
    server.listen(numericPort, '0.0.0.0', () => {
      console.log(`[start] Neel Solutions web and API listening on port ${numericPort}`);
      if (typeof startWhatsAppQueue === 'function') {
        try { startWhatsAppQueue(); } catch (e) { console.error('[WhatsApp queue]', e.message); }
      }
    });
  } else {
    // Phusion Passenger socket, Windows named pipe, or Unix domain socket
    server.listen(rawPort, () => {
      console.log(`[start] Neel Solutions web and API listening on socket ${rawPort}`);
      if (typeof startWhatsAppQueue === 'function') {
        try { startWhatsAppQueue(); } catch (e) { console.error('[WhatsApp queue]', e.message); }
      }
    });
  }
}

start().catch(error => {
  console.error('[start] Startup failed:', error);
  process.exitCode = 1;
});
