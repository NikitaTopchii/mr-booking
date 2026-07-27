import nextEslintPluginNext from '@next/eslint-plugin-next';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  nextEslintPluginNext.configs['core-web-vitals'],
  {
    ignores: ['.next/**/*', '.next-e2e/**/*'],
  },
];
