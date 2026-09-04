/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "*.cloudinary.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
  // Ensure the internal knowledge base (dataset/**) is bundled into the
  // serverless build. Next.js automatic file tracing cannot detect the folder
  // because it is read at runtime via fs.readdir/readFile (no static import),
  // which previously left the AI Assistant with an empty knowledge base in
  // production (responses did not match the data).
  outputFileTracingIncludes: {
    '/api/ai-assistant/chat': ['./dataset/**/*'],
    '/api/ai-assistant/chat/stream': ['./dataset/**/*'],
  },
  async headers() {
    return [
      {
        source: "/(dashboard|profil|cms)(/.*)?",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  },
};

export default nextConfig;
