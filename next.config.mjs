/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    // Exclude test files from bundle
    config.module = {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /node_modules\/thread-stream\/(test|LICENSE|README\.md)/,
          loader: 'ignore-loader',
        },
      ],
    }
    return config
  },
  turbopack: {},
  // Exclude problematic dependencies
  transpilePackages: ['@solana/wallet-adapter-react', '@solana/wallet-adapter-react-ui'],
}

export default nextConfig
