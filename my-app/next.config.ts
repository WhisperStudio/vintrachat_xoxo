import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  devIndicators: false,
  turbopack: {
    root: projectRoot,
  },
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
