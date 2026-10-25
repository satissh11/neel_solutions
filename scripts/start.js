const path = require('node:path');
const fs = require('node:fs');
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
