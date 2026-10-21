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

const needles = ["sb_secret_", "service_role"];
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (secretKey) needles.push(secretKey);

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
  if (needles.some((needle) => content.includes(needle))) offenders.push(file);
}

if (offenders.length > 0) {
  console.error(`Secret material found in ${offenders.length} client file(s):`);
  for (const file of offenders) console.error(`  ${file}`);
  process.exit(1);
}

console.log(`check:secrets OK: ${scanned} client files scanned, no secret material found.`);
