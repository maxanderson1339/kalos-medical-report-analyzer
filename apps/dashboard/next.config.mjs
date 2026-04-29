import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {},
    serverExternalPackages: ["pdf-parse"],
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.plugins.push(new PrismaPlugin());
        }
        return config;
    },
};

export default nextConfig;
