const { spawn } = require('node:child_process');

const isWindows = process.platform === 'win32';
const npm = isWindows ? 'npm.cmd' : 'npm';
const apiPort = process.env.API_PORT || '5000';
const webPort = process.env.PORT || '3000';

async function isRunning(port, path, matches) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      signal: AbortSignal.timeout(2500),
    });
    const body = await response.text();
    if (!matches(response.status, body)) {
      throw new Error(`Port ${port} is responding, but not with the expected Neel Solutions service.`);
    }
    return true;
  } catch (error) {
    if (error.name === 'AbortError' || error.name === 'TimeoutError' || error.cause?.code === 'ECONNREFUSED') {
      return false;
    }
    throw error;
  }
}

async function start() {
  if (apiPort === webPort) {
    throw new Error('API_PORT and PORT must be different.');
  }

  const apiRunning = await isRunning(
    apiPort,
    '/api/v1/health',
    (status, body) => (status === 200 || status === 503) && body.includes('"app":"Neel Solutions"'),
  );
  const webRunning = await isRunning(
    webPort,
    '/',
    (status, body) => status >= 200 && status < 400 && /<title>Neel Solutions\b/i.test(body),
  );

  if (apiRunning && webRunning) {
    console.log(`Neel Solutions is already running at http://localhost:${webPort} (API: ${apiPort}).`);
    return;
  }

  const api = apiRunning ? null : spawn(npm, ['run', 'start', '--workspace=api'], {
    stdio: 'inherit',
    shell: isWindows,
    env: { ...process.env, PORT: apiPort },
  });
  const web = webRunning ? null : spawn(npm, ['run', 'start', '--workspace=web'], {
    stdio: 'inherit',
    shell: isWindows,
    env: { ...process.env, PORT: webPort, API_INTERNAL_URL: process.env.API_INTERNAL_URL || `http://127.0.0.1:${apiPort}` },
  });

  let stopping = false;
  function stop(code = 0) {
    if (stopping) return;
    stopping = true;
    api?.kill();
    web?.kill();
    process.exitCode = code;
  }

  api?.on('exit', code => { if (!stopping) stop(code || 1); });
  web?.on('exit', code => { if (!stopping) stop(code || 1); });
  process.on('SIGINT', () => stop(0));
  process.on('SIGTERM', () => stop(0));
}

start().catch(error => {
  console.error(`[start] ${error.message}`);
  process.exitCode = 1;
});
