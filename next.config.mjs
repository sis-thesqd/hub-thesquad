/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        optimizePackageImports: ["@untitledui/icons"],
    },
    turbopack: {
        root: process.cwd(),
    },
};

export default nextConfig;
