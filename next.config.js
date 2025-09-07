/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  experimental: {
    // Remove appDir as it's no longer needed in Next.js 14
  },
  env: {
    HF_API_KEY: process.env.HF_API_KEY,
  },
}

module.exports = nextConfig
