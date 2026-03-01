/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL;
        return [
          {
            source: '/api/crm/:path*',
            destination: `${backendUrl}/api/crm/:path*`,
          },
        ];
    },
}

export default nextConfig
