#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, parse, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ignoredDirectories = new Set([
  '.git',
  '.next',
  'coverage',
  'dist',
  'node_modules',
]);
const sourceFileExpression = /\.[cm]?[jt]sx?$/u;
const tagGroups = {
  scope: new Set([
    'scope:app',
    'scope:workspace',
    'scope:shared',
    'scope:auth',
    'scope:booking',
    'scope:rooms',
  ]),
  type: new Set([
    'type:app',
    'type:feature',
    'type:application',
    'type:api',
    'type:domain',
    'type:data-access',
    'type:infrastructure',
    'type:ui',
    'type:util',
    'type:testing',
    'type:tooling',
  ]),
  platform: new Set(['platform:web', 'platform:server', 'platform:agnostic']),
};
const typeDependencies = {
  'type:app': new Set([
    'type:feature',
    'type:application',
    'type:api',
    'type:ui',
    'type:data-access',
    'type:infrastructure',
    'type:domain',
    'type:util',
  ]),
  'type:application': new Set(['type:domain', 'type:util']),
  'type:api': new Set([
    'type:application',
    'type:data-access',
    'type:infrastructure',
    'type:domain',
    'type:util',
  ]),
  'type:feature': new Set([
    'type:ui',
    'type:data-access',
    'type:domain',
    'type:util',
  ]),
  'type:ui': new Set(['type:ui', 'type:domain', 'type:util']),
  'type:data-access': new Set([
    'type:application',
    'type:infrastructure',
    'type:domain',
    'type:util',
  ]),
  'type:infrastructure': new Set([
    'type:infrastructure',
    'type:domain',
    'type:util',
  ]),
  'type:domain': new Set(['type:domain', 'type:util']),
  'type:util': new Set(['type:util']),
  'type:testing': new Set([
    'type:application',
    'type:data-access',
    'type:infrastructure',
    'type:domain',
    'type:ui',
    'type:util',
    'type:testing',
  ]),
  'type:tooling': new Set([
    'type:application',
    'type:data-access',
    'type:infrastructure',
    'type:domain',
    'type:util',
    'type:tooling',
  ]),
};
const platformDependencies = {
  'platform:web': new Set(['platform:web', 'platform:agnostic']),
  'platform:server': new Set(['platform:server', 'platform:agnostic']),
  'platform:agnostic': new Set(['platform:agnostic']),
};
const scopeDependencies = {
  'scope:shared': new Set(['scope:shared']),
  'scope:auth': new Set(['scope:auth', 'scope:shared']),
  'scope:rooms': new Set(['scope:rooms', 'scope:shared']),
  'scope:booking': new Set([
    'scope:booking',
    'scope:shared',
    'scope:auth',
    'scope:rooms',
  ]),
  'scope:app': new Set([
    'scope:app',
    'scope:shared',
    'scope:auth',
    'scope:booking',
    'scope:rooms',
  ]),
  'scope:workspace': new Set([
    'scope:workspace',
    'scope:shared',
    'scope:auth',
    'scope:booking',
    'scope:rooms',
  ]),
};
const crossScopeAllowlist = new Map([
  [
    'api',
    new Set([
      'auth-application',
      'auth-data-access',
      'auth-domain',
      'auth-infrastructure',
      'booking-application',
      'booking-data-access',
      'booking-domain',
      'booking-infrastructure',
      'rooms-data-access',
      'rooms-domain',
    ]),
  ],
  [
    'web',
    new Set([
      'auth-data-access-web',
      'auth-domain',
      'auth-feature-email-verification',
      'auth-feature-web',
      'auth-ui',
      'booking-feature-my-bookings',
      'booking-feature-schedule',
    ]),
  ],
  [
    'workspace-tooling',
    new Set([
      'auth-data-access',
      'auth-domain',
      'auth-infrastructure',
      'booking-data-access',
      'booking-infrastructure',
      'rooms-data-access',
      'rooms-domain',
    ]),
  ],
  ['booking-application', new Set(['auth-domain', 'rooms-domain'])],
  [
    'booking-data-access',
    new Set([
      'auth-domain',
      'auth-infrastructure',
      'rooms-domain',
      'rooms-infrastructure',
    ]),
  ],
  ['booking-feature-my-bookings', new Set(['auth-ui'])],
  ['booking-feature-schedule', new Set(['auth-ui'])],
  [
    'booking-infrastructure',
    new Set(['auth-infrastructure', 'rooms-infrastructure']),
  ],
]);

function findRepositoryRoot(startDirectory) {
  let directory = startDirectory;
  const filesystemRoot = parse(directory).root;

  while (true) {
    if (
      existsSync(join(directory, 'package.json')) &&
      existsSync(join(directory, 'nx.json'))
    ) {
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

function packageManagerCommand() {
  return process.platform === 'win32' ? 'yarn.cmd' : 'yarn';
}

function listProjectFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return ignoredDirectories.has(entry.name) ? [] : listProjectFiles(path);
    }
    return entry.name === 'project.json' ? [path] : [];
  });
}

function listSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return ignoredDirectories.has(entry.name) ? [] : listSourceFiles(path);
    }
    return sourceFileExpression.test(entry.name) ? [path] : [];
  });
}

function projectTag(project, group) {
  return project.tags.find((tag) => tag.startsWith(`${group}:`));
}

function isTestFile(path) {
  return /\.(?:spec|test|integration\.spec)\.[cm]?[jt]sx?$/u.test(path);
}

function isClientComponent(source) {
  return /^\s*['"]use client['"];?/u.test(source);
}

function importedSpecifiers(filePath, source) {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const specifiers = [];
  const add = (value) => {
    if (value.startsWith('@mr-booking/')) specifiers.push(value);
  };
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      add(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      add(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return specifiers;
}

function assertAllowedSchemaImport(sourceProject, targetProject, sourcePath) {
  const approvedTargets = {
    'auth-data-access': new Set(['auth-infrastructure']),
    'booking-data-access': new Set([
      'auth-infrastructure',
      'booking-infrastructure',
      'rooms-infrastructure',
    ]),
    'booking-infrastructure': new Set([
      'auth-infrastructure',
      'rooms-infrastructure',
    ]),
    'rooms-data-access': new Set(['rooms-infrastructure']),
  };
  if (approvedTargets[sourceProject.name]?.has(targetProject.name)) return;
  if (
    sourceProject.name === 'api' &&
    isTestFile(sourcePath) &&
    new Set(['auth-infrastructure', 'booking-infrastructure']).has(
      targetProject.name,
    )
  )
    return;
  if (
    sourceProject.name === 'workspace-tooling' &&
    isTestFile(sourcePath) &&
    new Set(['auth-infrastructure', 'booking-infrastructure']).has(
      targetProject.name,
    )
  )
    return;
  throw new Error(
    `${relative(repositoryRoot, sourcePath)} may not import ${targetProject.name}/schema.`,
  );
}

function assertSourceImportPolicy(
  sourceProject,
  targetProject,
  sourcePath,
  source,
  specifier,
) {
  const sourcePlatform = projectTag(sourceProject, 'platform');
  const sourceType = projectTag(sourceProject, 'type');
  if (specifier.endsWith('/schema')) {
    if (sourcePlatform === 'platform:web')
      throw new Error(
        `${relative(repositoryRoot, sourcePath)} is web code and may not import persistence schemas.`,
      );
    if (sourceType === 'type:application')
      throw new Error(
        `${relative(repositoryRoot, sourcePath)} is application code and may not import persistence schemas.`,
      );
    assertAllowedSchemaImport(sourceProject, targetProject, sourcePath);
  }
  if (
    specifier === '@mr-booking/auth-data-access-web/client' &&
    sourcePlatform !== 'platform:web'
  ) {
    throw new Error(
      `${relative(repositoryRoot, sourcePath)} may not import the web client entry point from ${sourcePlatform}.`,
    );
  }
  if (
    specifier === '@mr-booking/auth-data-access-web/server' ||
    specifier === '@mr-booking/shared-i18n/server'
  ) {
    if (sourceProject.name !== 'web' || isClientComponent(source)) {
      throw new Error(
        `${relative(repositoryRoot, sourcePath)} may not import the Next server-only entry point ${specifier}.`,
      );
    }
  }
  if (specifier === '@mr-booking/shared-config/node') {
    if (
      !new Set(['api', 'shared-database', 'workspace-tooling']).has(
        sourceProject.name,
      )
    ) {
      throw new Error(
        `${relative(repositoryRoot, sourcePath)} may not import the Node-only configuration entry point.`,
      );
    }
  }
  if (
    specifier === '@mr-booking/booking-data-access/seed' &&
    sourceProject.name !== 'workspace-tooling'
  ) {
    throw new Error(
      `${relative(repositoryRoot, sourcePath)} may not import the seed entry point outside workspace tooling.`,
    );
  }
  if (specifier.endsWith('/testing') && !isTestFile(sourcePath)) {
    throw new Error(
      `${relative(repositoryRoot, sourcePath)} is runtime code and may not import a testing entry point.`,
    );
  }
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = findRepositoryRoot(scriptDirectory);
const projectFiles = ['apps', 'libs', 'tools'].flatMap((directory) =>
  listProjectFiles(join(repositoryRoot, directory)),
);
const projects = projectFiles.map((projectPath) => {
  const configuration = JSON.parse(readFileSync(projectPath, 'utf8'));
  return {
    ...configuration,
    projectPath,
    root: dirname(projectPath),
    sourcePath: resolve(repositoryRoot, configuration.sourceRoot),
  };
});
const projectsByName = new Map(
  projects.map((project) => [project.name, project]),
);
const errors = [];

for (const project of projects) {
  for (const [group, vocabulary] of Object.entries(tagGroups)) {
    const tags = project.tags.filter((tag) => tag.startsWith(`${group}:`));
    if (tags.length !== 1 || !vocabulary.has(tags[0])) {
      errors.push(
        `${relative(repositoryRoot, project.projectPath)} must have exactly one approved ${group} tag; found ${tags.join(', ') || 'none'}.`,
      );
    }
  }
}

const graphPath = '/tmp/mr-booking-boundary-graph.json';
try {
  execFileSync(
    packageManagerCommand(),
    ['nx', 'graph', `--file=${graphPath}`],
    {
      cwd: repositoryRoot,
      stdio: 'pipe',
    },
  );
} catch (error) {
  const output = [error.stdout, error.stderr]
    .filter(Boolean)
    .map(String)
    .join('\n');
  throw new Error(
    `Could not generate the Nx graph for boundary auditing.\n${output}`,
  );
}

const graphDocument = JSON.parse(readFileSync(graphPath, 'utf8'));
const graph = graphDocument.graph ?? graphDocument;
const dependencies = graph.dependencies ?? {};
const nodes = graph.nodes ?? {};
const indegree = new Map(Object.keys(nodes).map((name) => [name, 0]));
for (const edges of Object.values(dependencies)) {
  for (const edge of edges)
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
}
const queue = [...indegree]
  .filter(([, count]) => count === 0)
  .map(([name]) => name);
for (let index = 0; index < queue.length; index += 1) {
  for (const edge of dependencies[queue[index]] ?? []) {
    const count = indegree.get(edge.target) - 1;
    indegree.set(edge.target, count);
    if (count === 0) queue.push(edge.target);
  }
}
if (queue.length !== indegree.size) {
  errors.push(
    `Project dependency cycle detected: ${[...indegree]
      .filter(([, count]) => count > 0)
      .map(([name]) => name)
      .join(', ')}.`,
  );
}

for (const [sourceName, edges] of Object.entries(dependencies)) {
  const sourceProject = projectsByName.get(sourceName);
  if (!sourceProject) continue;
  for (const edge of edges) {
    const targetProject = projectsByName.get(edge.target);
    if (!targetProject) continue;
    const sourceType = projectTag(sourceProject, 'type');
    const targetType = projectTag(targetProject, 'type');
    const sourcePlatform = projectTag(sourceProject, 'platform');
    const targetPlatform = projectTag(targetProject, 'platform');
    const sourceScope = projectTag(sourceProject, 'scope');
    const targetScope = projectTag(targetProject, 'scope');
    if (!typeDependencies[sourceType]?.has(targetType))
      errors.push(
        `${sourceName} (${sourceType}) may not depend on ${edge.target} (${targetType}).`,
      );
    if (!platformDependencies[sourcePlatform]?.has(targetPlatform))
      errors.push(
        `${sourceName} (${sourcePlatform}) may not depend on ${edge.target} (${targetPlatform}).`,
      );
    if (!scopeDependencies[sourceScope]?.has(targetScope))
      errors.push(
        `${sourceName} (${sourceScope}) may not depend on ${edge.target} (${targetScope}).`,
      );
    if (
      sourceScope !== targetScope &&
      targetScope !== 'scope:shared' &&
      !crossScopeAllowlist.get(sourceName)?.has(edge.target)
    ) {
      errors.push(
        `${sourceName} -> ${edge.target} is not in the exact cross-scope allowlist.`,
      );
    }
  }
}

for (const sourceProject of projects) {
  for (const sourcePath of listSourceFiles(sourceProject.sourcePath)) {
    const source = readFileSync(sourcePath, 'utf8');
    for (const specifier of importedSpecifiers(sourcePath, source)) {
      const packageName = specifier.split('/').slice(0, 2).join('/');
      const targetProject = projects.find(
        (project) => project.name === packageName.replace('@mr-booking/', ''),
      );
      if (targetProject) {
        try {
          assertSourceImportPolicy(
            sourceProject,
            targetProject,
            sourcePath,
            source,
            specifier,
          );
        } catch (error) {
          errors.push(error.message);
        }
      }
    }
  }
}

if (errors.length > 0) {
  process.stderr.write(
    `Nx module-boundary audit failed:\n${errors.map((error) => `- ${error}`).join('\n')}\n`,
  );
  process.exit(1);
}

const edgeCount = Object.values(dependencies).reduce(
  (count, edges) => count + edges.length,
  0,
);
process.stdout.write(
  `Nx module-boundary audit passed: ${projects.length} projects, ${edgeCount} dependencies, no cycles, and no prohibited source imports.\n`,
);
