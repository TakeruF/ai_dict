import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",          // Static export for Capacitor
  images: { unoptimized: true }, // Required for static export
  trailingSlash: true,       // Generates out/hsk/1/index.html so Capacitor WebView can serve it
};

export default nextConfig;
