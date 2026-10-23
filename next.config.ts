import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Keeps future invite-link tokens out of Referer headers sent to other sites.
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  // tesseract.js starts Node worker threads from its own files, so it must not be bundled.
  serverExternalPackages: ["tesseract.js"],
  // The read endpoint loads the worker script, the WebAssembly core and the bundled language
  // data from disk at runtime, which file tracing cannot see.
  outputFileTracingIncludes: {
    "/api/recipes/read": [
      "./node_modules/tesseract.js/**/*",
      "./node_modules/tesseract.js-core/**/*",
      "./src/lib/recognition/tessdata/*.traineddata.gz",
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
};

export default nextConfig;
