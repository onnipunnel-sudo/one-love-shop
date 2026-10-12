/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export so the site deploys anywhere (Vercel, Netlify, any static host)
  output: 'export',
  // Images are plain <img> tags (no next/image optimization) to stay export-safe
  images: { unoptimized: true },
  trailingSlash: true,
};

module.exports = nextConfig;
