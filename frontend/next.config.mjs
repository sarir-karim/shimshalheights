/** @type {import('next').NextConfig} */
const BACKEND_URL = (process.env.BACKEND_URL ?? (process.env.NODE_ENV === "production" ? "https://shimshalheights.vercel.app" : "http://localhost:5000")).replace(/\/$/, "");

const nextConfig = {
  reactStrictMode: true,
  // The admin panel calls /api/* on its own origin and Next forwards it to the Express API.
  // Same origin means the httpOnly session cookie just works and no CORS is needed.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Cloudinary is whitelisted now so the admin-managed images work later without config changes.
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
    // Demo art is SVG; SmartImage opts those out of the optimizer.
    dangerouslyAllowSVG: false,
  },
};
export default nextConfig;
