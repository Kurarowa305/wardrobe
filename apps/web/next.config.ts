import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  devIndicators: false, // Keep the throwaway UI review unobstructed.
};

export default nextConfig;
