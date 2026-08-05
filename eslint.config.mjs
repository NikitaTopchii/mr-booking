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

const typeDependencyConstraints = [
  {
    sourceTag: 'type:app',
    onlyDependOnLibsWithTags: [
      'type:feature',
      'type:application',
      'type:api',
      'type:ui',
      'type:data-access',
      'type:infrastructure',
      'type:domain',
      'type:util',
    ],
  },
  {
    sourceTag: 'type:application',
    onlyDependOnLibsWithTags: ['type:domain', 'type:util'],
  },
  {
    sourceTag: 'type:api',
    onlyDependOnLibsWithTags: [
      'type:application',
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
      'type:application',
      'type:infrastructure',
      'type:domain',
      'type:util',
    ],
  },
  {
    sourceTag: 'type:infrastructure',
    onlyDependOnLibsWithTags: [
      'type:infrastructure',
      'type:domain',
      'type:util',
    ],
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
    sourceTag: 'type:tooling',
    onlyDependOnLibsWithTags: [
      'type:application',
      'type:data-access',
      'type:infrastructure',
      'type:domain',
      'type:util',
      'type:tooling',
    ],
  },
];

const platformDependencyConstraints = [
  {
    sourceTag: 'platform:web',
    onlyDependOnLibsWithTags: ['platform:web', 'platform:agnostic'],
  },
  {
    sourceTag: 'platform:server',
    onlyDependOnLibsWithTags: ['platform:server', 'platform:agnostic'],
  },
  {
    sourceTag: 'platform:agnostic',
    onlyDependOnLibsWithTags: ['platform:agnostic'],
  },
];

const scopeDependencyConstraints = [
  {
    sourceTag: 'scope:shared',
    onlyDependOnLibsWithTags: ['scope:shared'],
  },
  {
    sourceTag: 'scope:auth',
    onlyDependOnLibsWithTags: ['scope:auth', 'scope:shared'],
  },
  {
    sourceTag: 'scope:rooms',
    onlyDependOnLibsWithTags: ['scope:rooms', 'scope:shared'],
  },
  {
    // The graph audit narrows every booking-to-auth/rooms edge to its exact pair.
    sourceTag: 'scope:booking',
    onlyDependOnLibsWithTags: [
      'scope:booking',
      'scope:shared',
      'scope:auth',
      'scope:rooms',
    ],
  },
  {
    // Applications compose real business scopes; platform and type rules still apply.
    sourceTag: 'scope:app',
    onlyDependOnLibsWithTags: [
      'scope:app',
      'scope:shared',
      'scope:auth',
      'scope:booking',
      'scope:rooms',
    ],
  },
  {
    // Workspace scripts and architecture tests are server-only composition tooling.
    sourceTag: 'scope:workspace',
    onlyDependOnLibsWithTags: [
      'scope:workspace',
      'scope:shared',
      'scope:auth',
      'scope:booking',
      'scope:rooms',
    ],
  },
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
            ...typeDependencyConstraints,
            ...platformDependencyConstraints,
            ...scopeDependencyConstraints,
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
