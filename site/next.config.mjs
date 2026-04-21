/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      {
        source: "/wallet",
        destination: "https://wallet.tipspay.org",
        permanent: true,
      },
      {
        source: "/wallet/:path*",
        destination: "https://wallet.tipspay.org/:path*",
        permanent: true,
      },
      {
        source: "/dex",
        destination: "https://dex.tipspay.org",
        permanent: true,
      },
      {
        source: "/dex/:path*",
        destination: "https://dex.tipspay.org/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*.(svg|png|jpg|jpeg|gif|webp|avif|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/api/username/check",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=5, stale-while-revalidate=10",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
