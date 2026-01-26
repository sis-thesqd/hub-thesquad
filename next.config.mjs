/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        optimizePackageImports: ["@untitledui/icons", "@untitledui/file-icons"],
    },
    turbopack: {
        root: process.cwd(),
    },
};

export default nextConfig;
