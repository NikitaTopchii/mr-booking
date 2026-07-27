// @ts-check

const path = require('node:path');
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  distDir: process.env.E2E_RUNTIME === 'true' ? '.next-e2e' : '.next',
  outputFileTracingRoot: path.join(__dirname, '../..'),
  async rewrites() {
    const apiInternalUrl =
      process.env.API_INTERNAL_URL ?? 'http://localhost:3002';

    return [
      {
        source: '/api/:path*',
        destination: `${apiInternalUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
