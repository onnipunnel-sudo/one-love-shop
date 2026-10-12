/** @type {import('next').NextConfig} */
const nextConfig = {
  // Images are plain <img> tags (no next/image optimization)
  images: { unoptimized: true },
  trailingSlash: true,
};

module.exports = nextConfig;
