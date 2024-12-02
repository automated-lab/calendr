/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',  // Also add GitHub for GitHub auth
      }
    ],
    domains: ['utfs.io'],
  },
}

module.exports = nextConfig 