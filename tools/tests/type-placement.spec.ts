import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const workspaceRoot = resolve(__dirname, '../..');
const eslintExecutable = join(workspaceRoot, 'node_modules/.bin/eslint');

describe('type-placement lint policy', () => {
  it.each([
    ['interface', 'interface MisplacedOptions { readonly enabled: boolean }'],
    ['type alias', 'type MisplacedResult = { readonly status: string }'],
  ])('rejects a top-level %s in an implementation file', async (_, source) => {
    const messages = await lintVirtual(
      'libs/booking/data-access/src/lib/example-service.ts',
      `${source}\nexport function run(): void {}`,
    );

    expect(messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: 'no-restricted-syntax' }),
      ]),
    );
  });

  it.each([
    [
      'types directory',
      'libs/booking/data-access/src/lib/types/example.types.ts',
      'export interface ExampleOptions { readonly enabled: boolean }',
    ],
    [
      'types suffix',
      'libs/booking/data-access/src/lib/example.types.ts',
      'export type ExampleResult = { readonly status: string }',
    ],
    [
      'schema-derived type',
      'apps/api/src/app/example.schema.ts',
      'export const schema = { parse: (value: unknown) => value }; export type SchemaOutput = ReturnType<typeof schema.parse>;',
    ],
    [
      'domain contract',
      'libs/booking/domain/src/lib/example-contracts.ts',
      'export interface DomainModel { readonly id: string }',
    ],
  ])('allows a declaration in a %s file', async (_, file, source) => {
    await expect(lintVirtual(file, source)).resolves.toEqual([]);
  });

  it('accepts type-only imports in implementation files', async () => {
    await expect(
      lintVirtual(
        'libs/booking/data-access/src/lib/example-service.ts',
        "import type { ExampleOptions } from './types/example.types';\nexport function run(options: ExampleOptions): boolean { return options.enabled; }",
      ),
    ).resolves.toEqual([]);
  });
});

async function lintVirtual(file: string, source: string) {
  const result = spawnSync(
    eslintExecutable,
    [
      '--config',
      join(workspaceRoot, 'eslint.config.mjs'),
      '--format',
      'json',
      '--stdin',
      '--stdin-filename',
      join(workspaceRoot, file),
    ],
    {
      cwd: workspaceRoot,
      encoding: 'utf8',
      input: source,
    },
  );

  if (result.error) {
    throw result.error;
  }

  const [lintResult] = JSON.parse(result.stdout) as Array<{
    messages: unknown[];
  }>;

  if (!lintResult) {
    throw new Error(
      `ESLint returned no result. stderr: ${result.stderr || '<empty>'}`,
    );
  }

  return lintResult.messages;
}
