import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {},
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.plugins.push(new PrismaPlugin());
        }
        return config;
    },
    async rewrites() {
        const membergptWebUrl = process.env.MEMBERGPT_WEB_URL;
        if (!membergptWebUrl) return [];
        return [
            {
                source: "/chat",
                destination: `${membergptWebUrl}/chat`,
            },
            {
                source: "/chat/:path*",
                destination: `${membergptWebUrl}/chat/:path*`,
            },
        ];
    },
};

export default nextConfig;
