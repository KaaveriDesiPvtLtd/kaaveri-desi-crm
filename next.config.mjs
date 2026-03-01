/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
        const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://api-kaaveri-desi.vercel.app').replace(/\/$/, '');
        return [
          {
            source: '/api/crm/:path*',
            destination: `${backendUrl}/api/crm/:path*`,
          },
        ];
    },
}

export default nextConfig
