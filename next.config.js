const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  //output: 'export', // Disabled to support dynamic admin routes
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    unoptimized: true,
  },
  env: {
    API_URL: process.env.API_URL || 'https://mbc.aureusprime.com/api',
  },
};

module.exports = nextConfig;
