/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    distDir: process.env.NODE_ENV === "development" ? ".next/dev" : ".next/build",
    experimental: {
      appDir: true,
      esmExternals: "loose", // required to make Konva & react-konva work
    },
    webpack: (config) => {
      config.externals = [...config.externals, { canvas: "canvas" }];  // required to make Konva & react-konva work
      return config;
    },
  };

export default nextConfig;
