import nx from '@nx/eslint-plugin';
import tseslint from 'typescript-eslint';

const typePlacementAllowedFiles = [
  '**/types/**',
  '**/*.types.*',
  '**/*.contracts.*',
  '**/*.dto.*',
  '**/*.model.*',
  '**/*.schema.*',
  '**/*.schemas.*',
  '**/*-contracts.*',
  '**/*-errors.*',
  '**/*-ports.*',
  '**/*-schema.*',
  '**/*-validation.*',
  '**/*-commands.*',
  '**/*-queries.*',
];

const typePlacementExceptions = [
  // The inferred public type is intentionally colocated with its Zod schema.
  'libs/shared/config/src/lib/environment.ts',
];

export default [
  ...nx.configs['flat/base'],
  ...tseslint.configs.recommended,
  {
    files: [
      '**/*.config.js',
      '**/*.config.cjs',
      '**/*.config.mjs',
      '**/*.config.cts',
      '**/jest.config.cts',
      'jest.preset.js',
    ],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          allow: [],
          banTransitiveDependencies: true,
          depConstraints: [
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'type:feature',
                'type:ui',
                'type:data-access',
                'type:infrastructure',
                'type:domain',
                'type:util',
              ],
            },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: [
                'type:ui',
                'type:data-access',
                'type:domain',
                'type:util',
              ],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:domain', 'type:util'],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: [
                'type:infrastructure',
                'type:domain',
                'type:util',
              ],
            },
            {
              sourceTag: 'type:infrastructure',
              onlyDependOnLibsWithTags: ['type:domain', 'type:util'],
            },
            {
              sourceTag: 'type:domain',
              onlyDependOnLibsWithTags: ['type:domain', 'type:util'],
            },
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util'],
            },
            {
              sourceTag: 'platform:web',
              onlyDependOnLibsWithTags: ['platform:web', 'platform:shared'],
            },
            {
              sourceTag: 'platform:api',
              onlyDependOnLibsWithTags: ['platform:api', 'platform:shared'],
            },
            {
              sourceTag: 'platform:shared',
              onlyDependOnLibsWithTags: ['platform:shared'],
            },
          ],
          enforceBuildableLibDependency: true,
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
    languageOptions: {
      parserOptions: {
        // Keep runtime imports intact when legacy decorator metadata may use them.
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          fixStyle: 'separate-type-imports',
          prefer: 'type-imports',
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
    ignores: [...typePlacementAllowedFiles, ...typePlacementExceptions],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Program > TSInterfaceDeclaration',
          message:
            'Move top-level interfaces from implementation files to the nearest type-focused module.',
        },
        {
          selector: 'Program > TSTypeAliasDeclaration',
          message:
            'Move top-level type aliases from implementation files to the nearest type-focused module.',
        },
      ],
    },
  },
];
