/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Hostinger's MySQL drops concurrent remote connections (max ~4 in
    // practice). Next's default parallel static generation spawns one worker
    // per CPU, each with its own Prisma pool, which overruns that limit and
    // fails the build with P1001. Serializing workers keeps it to one
    // connection. Remove if the deploy target is not DB-constrained.
    cpus: 1,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;