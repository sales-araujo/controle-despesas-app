import type { NextConfig } from "next";
import path from "path";
import nextPWA from "next-pwa";

const withPWA = nextPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
    };
    return config;
  },
};

export default withPWA(nextConfig);
