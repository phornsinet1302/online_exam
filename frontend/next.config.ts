import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.1.64.254"],

  turbopack: {
    root: path.resolve(__dirname),
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "@mui/material"],
  },
};

export default nextConfig;