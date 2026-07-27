import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const nxCommand =
  process.platform === 'win32'
    ? resolve('node_modules/.bin/nx.cmd')
    : resolve('node_modules/.bin/nx');
const nextCommand =
  process.platform === 'win32'
    ? resolve('node_modules/.bin/next.cmd')
    : resolve('node_modules/.bin/next');
const activeProcesses = new Set();
let shuttingDown = false;
let forceShutdownTimer;

for (const signal of ['SIGHUP', 'SIGINT', 'SIGTERM']) {
  process.once(signal, () => shutdown(signal, 0));
}

const buildResult = await runBuild();

if (buildResult !== 0 || shuttingDown) {
  process.exitCode = buildResult;
} else {
  const api = startProcess(process.execPath, ['dist/apps/api/main.js']);
  api.once('exit', (code, signal) => {
    if (!shuttingDown) {
      shutdown(signal ?? 'SIGTERM', code ?? 1);
    }
  });

  try {
    await waitForApiReadiness();

    if (!shuttingDown) {
      const web = startProcess(nextCommand, [
        'dev',
        'apps/web',
        '--port',
        process.env.WEB_INTERNAL_PORT ?? '3101',
      ]);
      web.once('exit', (code, signal) => {
        if (!shuttingDown) {
          shutdown(signal ?? 'SIGTERM', code ?? 1);
        }
      });
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    shutdown('SIGTERM', 1);
  }
}

function runBuild() {
  const build = startProcess(nxCommand, ['build', 'api']);

  return new Promise((resolveBuild) => {
    build.once('exit', (code) => {
      activeProcesses.delete(build);
      resolveBuild(code ?? 1);
    });
  });
}

function startProcess(command, args) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    env: process.env,
    detached: process.platform !== 'win32',
  });
  activeProcesses.add(child);
  child.once('error', (error) => {
    process.stderr.write(`Unable to start ${command}: ${error.message}\n`);
    shutdown('SIGTERM', 1);
  });
  return child;
}

async function waitForApiReadiness() {
  const apiPort = process.env.API_INTERNAL_PORT ?? '3102';
  const readinessUrl = `http://localhost:${apiPort}/api/health/ready`;
  const deadline = Date.now() + 60_000;

  while (!shuttingDown && Date.now() < deadline) {
    try {
      const response = await fetch(readinessUrl);

      if (response.ok) {
        return;
      }
    } catch {
      // The API process is still starting.
    }

    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }

  throw new Error(`API readiness timed out: ${readinessUrl}`);
}

function shutdown(signal, exitCode) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  process.exitCode = exitCode;

  for (const child of activeProcesses) {
    signalProcess(child, signal);
  }

  forceShutdownTimer = setTimeout(() => {
    for (const child of activeProcesses) {
      signalProcess(child, 'SIGKILL');
    }
    process.exit(exitCode);
  }, 3_000);

  Promise.all(
    [...activeProcesses].map(
      (child) =>
        new Promise((resolveExit) => {
          if (child.exitCode !== null || child.signalCode !== null) {
            resolveExit();
            return;
          }
          child.once('exit', resolveExit);
        }),
    ),
  ).then(() => {
    clearTimeout(forceShutdownTimer);
    process.exit(exitCode);
  });
}

function signalProcess(child, signal) {
  try {
    if (process.platform !== 'win32' && child.pid) {
      process.kill(-child.pid, signal);
    } else {
      child.kill(signal);
    }
  } catch (error) {
    if (error.code !== 'ESRCH') {
      throw error;
    }
  }
}
