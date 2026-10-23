/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      ...[
        "/models/optimized/:file",
        "/assets/gallery/:file",
        "/assets/fonts/:file",
      ].map((source) => ({
        source,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      })),
    ];
  },
  async redirects() {
    return [
      { source: "/work/2", destination: "/work/1#operations", permanent: true },
    ];
  },
  // SVG 파일 지원 설정
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

module.exports = nextConfig;
