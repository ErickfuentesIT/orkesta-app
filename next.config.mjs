const isProd = process.env.NODE_ENV === "production";
const dest = isProd
  ? "https://tu-backend.tu-dominio.com" // PROD
  : "http://localhost:8080"; // DEV

/** @type {import('next').NextConfig} */
// next.config.mjs
const nextConfig = {
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://localhost:8080/:path*" },
    ];
  },
};
export default nextConfig;
