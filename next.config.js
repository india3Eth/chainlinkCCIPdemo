/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        // added due to issues finding these packages when running. Github issue/comment:
        // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908#issuecomment-1487801131
        config.externals.push("pino-pretty", "lokijs", "encoding");
        return config;
    },
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
    },
    typescript: {
        // Warning: This allows production builds to successfully complete even if
        // your project has type errors.
        ignoreBuildErrors: true,
    },
}

module.exports = nextConfig
