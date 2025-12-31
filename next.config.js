/** @type {import('next').NextConfig} */
const nextConfig = {
    images:{
    unoptimized: true,
    domains: ['c.saavncdn.com','avatars.githubusercontent.com','lh3.googleusercontent.com']
    },
    
      swcMinify: true,
      compiler:{
        removeConsole: true,
      }
}

module.exports = nextConfig
