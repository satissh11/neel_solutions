const { spawn } = require('node:child_process');

const isWindows = process.platform === 'win32';
const npm = isWindows ? 'npm.cmd' : 'npm';
const apiPort = process.env.API_PORT || '5000';
const webPort = process.env.PORT || '3000';

const api = spawn(npm, ['run', 'start', '--workspace=api'], {
  stdio: 'inherit',
  shell: isWindows,
  env: { ...process.env, PORT: apiPort },
});
const web = spawn(npm, ['run', 'start', '--workspace=web'], {
  stdio: 'inherit',
  shell: isWindows,
  env: { ...process.env, PORT: webPort, API_INTERNAL_URL: process.env.API_INTERNAL_URL || `http://127.0.0.1:${apiPort}` },
});

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  api.kill();
  web.kill();
  process.exitCode = code;
}

api.on('exit', code => { if (!stopping) stop(code || 1); });
web.on('exit', code => { if (!stopping) stop(code || 1); });
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
