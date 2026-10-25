const path = require('node:path');
const { createServer } = require('node:http');

const projectRoot = path.resolve(__dirname, '..');
const webDir = path.join(projectRoot, 'apps', 'web');
const port = Number(process.env.PORT || 3000);

async function start() {
  // GoDaddy Node.js hosting provides one public application port. Mount the
  // API and Next.js on the same HTTP server instead of binding a blocked 5000.
  // This root start command always uses the in-process API, even if an old
  // API_INTERNAL_URL value is still present in the hosting environment.
  delete process.env.API_INTERNAL_URL;
  const next = require(require.resolve('next', { paths: [webDir] }));
  const { apiApp, startWhatsAppQueue } = require(path.join(projectRoot, 'apps', 'api', 'dist', 'index.js'));
  const nextApp = next({ dev: false, dir: webDir, hostname: '0.0.0.0', port });
  await nextApp.prepare();
  const handleNext = nextApp.getRequestHandler();

  const server = createServer((req, res) => {
    const pathname = (req.url || '/').split('?', 1)[0];
    const isApiRequest = pathname === '/api' || pathname.startsWith('/api/') || pathname === '/webhook' || pathname.startsWith('/webhook/');
    if (isApiRequest) {
      apiApp(req, res, () => handleNext(req, res));
      return;
    }
    handleNext(req, res);
  });

  server.on('error', error => {
    console.error('[start] HTTP server error:', error.message);
    process.exitCode = 1;
  });
  server.listen(port, '0.0.0.0', () => {
    console.log(`[start] Neel Solutions web and API listening on assigned port ${port}`);
    startWhatsAppQueue();
  });
}

start().catch(error => {
  console.error('[start] Startup failed:', error);
  process.exitCode = 1;
});
