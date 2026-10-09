import type { NextConfig } from 'next';

// Static export: every page is pre-rendered to plain HTML (GitHub Pages / any static host).
// NEXT_PUBLIC_BASE_PATH is set by the Pages workflow (e.g. "/Project-test-web"); empty for local work.
// NEXT_DIST_DIR lets several dev servers run side by side without sharing one .next folder.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
