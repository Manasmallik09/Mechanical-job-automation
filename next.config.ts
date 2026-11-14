import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/Mechanical-job-automation",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
