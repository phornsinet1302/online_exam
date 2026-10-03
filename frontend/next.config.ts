import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.7"],

  turbopack: {
    root: path.resolve(__dirname),
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "@mui/material"],
  },
};

export default nextConfig;