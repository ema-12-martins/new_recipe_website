// Scans the built client assets (.next/static) for server secrets. Run after `npm run build`.
// Prints only offending file names (never the secret) and exits 1 on any hit.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const STATIC_DIR = join(".next", "static");
if (!existsSync(STATIC_DIR)) {
  console.error("No .next/static directory: run `npm run build` first.");
  process.exit(2);
}

// A real secret key has characters after the prefix; the bare prefix alone also appears in
// supabase-js, which uses it to warn when a secret key reaches a browser.
const needles = [/sb_secret_[A-Za-z0-9_-]{8,}/, "service_role", /gsk_[A-Za-z0-9]{20,}/];
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (secretKey) needles.push(secretKey);
const groqKey = process.env.GROQ_API_KEY;
if (groqKey) needles.push(groqKey);

function* files(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else yield path;
  }
}

const offenders = [];
let scanned = 0;
for (const file of files(STATIC_DIR)) {
  scanned++;
  const content = readFileSync(file, "latin1");
  if (needles.some((needle) => (typeof needle === "string" ? content.includes(needle) : needle.test(content)))) {
    offenders.push(file);
  }
}

if (offenders.length > 0) {
  console.error(`Secret material found in ${offenders.length} client file(s):`);
  for (const file of offenders) console.error(`  ${file}`);
  process.exit(1);
}

console.log(`check:secrets OK: ${scanned} client files scanned, no secret material found.`);
