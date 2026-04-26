/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Reduce bundle work by only importing used members from heavy libraries.
  experimental: {
    optimizePackageImports: [
      'date-fns',
      'framer-motion',
      'react-hook-form',
      'zod',
    ],
  },
  images: {
    domains: ['res.cloudinary.com', 'avatars.githubusercontent.com'],
  },
  // Ensure WebSocket works in production
  async headers() {
    return [
      {
        source: '/socket.io/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
