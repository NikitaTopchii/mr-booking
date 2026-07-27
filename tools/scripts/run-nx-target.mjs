#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const [target, ...unexpectedArguments] = process.argv.slice(2);

if (!target || unexpectedArguments.length > 0) {
  process.stderr.write(
    'Usage: node tools/scripts/run-nx-target.mjs <target>\n',
  );
  process.exit(2);
}

const nxCommand = process.platform === 'win32' ? 'nx.cmd' : 'nx';
const discovery = spawnSync(
  nxCommand,
  ['show', 'projects', `--with-target=${target}`, '--json'],
  {
    encoding: 'utf8',
  },
);

if (discovery.error) {
  process.stderr.write(`Unable to start Nx: ${discovery.error.message}\n`);
  process.exit(1);
}

if (discovery.status !== 0) {
  process.stderr.write(discovery.stderr);
  process.exit(discovery.status ?? 1);
}

let projects;
try {
  projects = JSON.parse(discovery.stdout);
} catch {
  process.stderr.write(
    `Nx returned invalid project data for the "${target}" target.\n`,
  );
  process.exit(1);
}

if (!Array.isArray(projects) || projects.length === 0) {
  process.stderr.write(
    `No Nx projects define the "${target}" target. ` +
      'This check cannot pass until a real target is configured.\n',
  );
  process.exit(1);
}

const result = spawnSync(
  nxCommand,
  [
    'run-many',
    `--target=${target}`,
    `--projects=${projects.join(',')}`,
    '--outputStyle=static',
  ],
  {
    stdio: 'inherit',
    env: { ...process.env, CI: 'true' },
  },
);

if (result.error) {
  process.stderr.write(`Unable to start Nx: ${result.error.message}\n`);
  process.exit(1);
}

process.exit(result.status ?? 1);
