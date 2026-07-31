import { readFileSync, statSync } from 'node:fs';
import { relative } from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const root = process.cwd();
const configPath = ts.findConfigFile(
  root,
  ts.sys.fileExists,
  'tsconfig.base.json',
);
if (!configPath) throw new Error('tsconfig.base.json was not found');

const config = ts.readConfigFile(configPath, ts.sys.readFile);
if (config.error)
  throw new Error(
    ts.flattenDiagnosticMessageText(config.error.messageText, '\n'),
  );

const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root, {
  allowJs: false,
  noEmit: true,
});
const genericName = /(?:^|[-.])(common|helpers?|utils?)(?:[-.]|$)/iu;
const candidates = [];

for (const fileName of parsed.fileNames) {
  const path = relative(root, fileName);
  if (
    !/^(apps|libs|tools)\//u.test(path) ||
    /(?:\.spec|\.test|\.types|\.contracts)\.[cm]?tsx?$/u.test(path) ||
    path.endsWith('/index.ts') ||
    !statSync(fileName).isFile()
  ) {
    continue;
  }

  const sourceText = readFileSync(fileName, 'utf8');
  const source = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
  );
  const lines = source.getLineAndCharacterOfPosition(source.end).line + 1;
  const runtimeExports = source.statements.filter((statement) => {
    const modifiers = ts.canHaveModifiers(statement)
      ? ts.getModifiers(statement)
      : undefined;
    return (
      modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      ) &&
      !ts.isInterfaceDeclaration(statement) &&
      !ts.isTypeAliasDeclaration(statement)
    );
  }).length;
  const signals = [];
  if (lines >= 300) signals.push(`${lines} lines`);
  if (runtimeExports >= 8) signals.push(`${runtimeExports} runtime exports`);
  if (genericName.test(path)) signals.push('generic module name');
  if (signals.length > 0) candidates.push({ path, signals });
}

console.log('Module-cohesion review candidates (heuristics only):');
if (candidates.length === 0) console.log('  none');
for (const candidate of candidates.sort((left, right) =>
  left.path.localeCompare(right.path),
)) {
  console.log(`  ${candidate.path}: ${candidate.signals.join(', ')}`);
}
