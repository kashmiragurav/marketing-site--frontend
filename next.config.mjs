/** @type {import('next').NextConfig} */
const nextConfig = {
  

  async rewrites() {
    return [
      {
        source:      '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ]
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
    ],
  },
}

export default nextConfig
