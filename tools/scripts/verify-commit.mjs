#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

function findRepositoryRoot(startDirectory) {
  let directory = startDirectory;
  const filesystemRoot = parse(directory).root;

  while (true) {
    const packagePath = join(directory, 'package.json');
    const nxPath = join(directory, 'nx.json');

    if (existsSync(packagePath) && existsSync(nxPath)) {
      return directory;
    }

    if (directory === filesystemRoot) {
      throw new Error(
        `Could not find a repository root above ${startDirectory}.`,
      );
    }

    directory = dirname(directory);
  }
}

function parsePackageManager(value) {
  if (typeof value !== 'string') {
    throw new Error('package.json must define a pinned packageManager.');
  }

  const separatorIndex = value.lastIndexOf('@');
  if (separatorIndex <= 0 || separatorIndex === value.length - 1) {
    throw new Error('packageManager must include an exact version.');
  }

  const name = value.slice(0, separatorIndex);
  if (!['npm', 'pnpm', 'yarn'].includes(name)) {
    throw new Error(`Unsupported package manager: ${name}.`);
  }

  return name;
}

function packageManagerCommand(name) {
  return process.platform === 'win32' ? `${name}.cmd` : name;
}

function runScript(repositoryRoot, packageManager, scriptName) {
  const command = packageManagerCommand(packageManager);
  const args =
    packageManager === 'npm' ? ['run', scriptName] : ['run', scriptName];

  process.stdout.write(`\n=== ${scriptName} ===\n`);
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    stdio: 'inherit',
    env: { ...process.env, CI: 'true' },
  });

  if (result.error) {
    throw new Error(
      `Failed to start "${command} ${args.join(' ')}": ${result.error.message}`,
    );
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = findRepositoryRoot(scriptDirectory);
const packagePath = join(repositoryRoot, 'package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts ?? {};
const packageManager = parsePackageManager(packageJson.packageManager);

const requiredScripts = ['test', 'lint', 'typecheck', 'build', 'format:check'];
for (const scriptName of requiredScripts) {
  if (
    typeof scripts[scriptName] !== 'string' ||
    scripts[scriptName].trim() === ''
  ) {
    throw new Error(`Missing required package script: ${scriptName}.`);
  }
}

const commands = ['test'];
for (const optionalSuite of ['test:integration', 'test:e2e']) {
  if (typeof scripts[optionalSuite] === 'string') {
    commands.push(optionalSuite);
  } else {
    process.stdout.write(
      `Optional suite "${optionalSuite}" is not configured; it will run ` +
        'automatically when that canonical package script is added.\n',
    );
  }
}
commands.push('lint', 'typecheck', 'build', 'format:check');

for (const scriptName of commands) {
  runScript(repositoryRoot, packageManager, scriptName);
}

process.stdout.write('\nAll commit verification checks passed.\n');
