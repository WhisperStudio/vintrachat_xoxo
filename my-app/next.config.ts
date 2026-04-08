import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: '/widget/:widgetKey.js',
        destination: '/api/widget-script/:widgetKey',
      },
    ]
  },
};

export default nextConfig;
