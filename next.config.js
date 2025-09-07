/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  experimental: {
    appDir: false,
  },
  env: {
    HF_API_KEY: process.env.HF_API_KEY,
  },
}

module.exports = nextConfig
