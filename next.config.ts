import type { NextConfig } from "next";
import { workbenchOrigins } from "./src/features/workspace/workbench-origins";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  typedRoutes: true,
  async headers() {
    return [{
      source: "/workbench-demo",
      headers: [{
        key: "Content-Security-Policy",
        value: `frame-ancestors ${workbenchOrigins.join(" ")}`,
      }],
    }];
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
