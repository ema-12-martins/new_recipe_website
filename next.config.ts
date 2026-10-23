import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { NextConfig } from "next";

/** A package and everything it depends on, so its worker thread finds every module it requires. */
function packageWithDependencies(name: string, seen = new Set<string>()): string[] {
  if (seen.has(name)) return [];
  seen.add(name);
  const manifest = JSON.parse(
    readFileSync(join(process.cwd(), "node_modules", name, "package.json"), "utf8"),
  ) as { dependencies?: Record<string, string> };
  return [
    name,
    ...Object.keys(manifest.dependencies ?? {}).flatMap((dependency) =>
      packageWithDependencies(dependency, seen),
    ),
  ];
}

const TESSERACT_FILES = [
  ...packageWithDependencies("tesseract.js").map((name) => `./node_modules/${name}/**/*`),
  "./src/lib/recognition/tessdata/*.traineddata.gz",
];

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
  // data from disk at runtime, which file tracing cannot see. The worker thread also requires
  // these dependencies itself, so they must be listed too.
  outputFileTracingIncludes: {
    "/api/recipes/read": TESSERACT_FILES,
    "/api/recipes/read-diag": TESSERACT_FILES,
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
