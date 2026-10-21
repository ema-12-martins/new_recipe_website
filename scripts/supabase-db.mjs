// Usage: node scripts/supabase-db.mjs push|status dev|prod
// Runs Supabase CLI migration commands against the DEV or PRODUCTION database
// using connection strings from .env.local. Never prints the connection string.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const COMMANDS = {
  push: ["db", "push"],
  status: ["migration", "list"],
};
const TARGETS = {
  dev: "SUPABASE_DEV_DB_URL",
  prod: "SUPABASE_PROD_DB_URL",
};

const [action, target] = process.argv.slice(2);

if (!COMMANDS[action] || !TARGETS[target]) {
  console.error("Usage: node scripts/supabase-db.mjs push|status dev|prod");
  process.exit(2);
}

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const envName = TARGETS[target];
const dbUrl = process.env[envName];
if (!dbUrl) {
  console.error(`${envName} is not set (expected in .env.local).`);
  process.exit(2);
}

const mask = (text) => text.split(dbUrl).join("postgres://***");

console.log(`Target: ${target}`);
console.log(`Running: supabase ${COMMANDS[action].join(" ")} --db-url postgres://***`);

// Invoke the locally installed CLI with node directly (no shell), so the password in the
// connection string is never re-parsed by cmd.exe or sh.
const cliEntry = fileURLToPath(new URL("../node_modules/supabase/dist/supabase.js", import.meta.url));
const child = spawn(process.execPath, [cliEntry, ...COMMANDS[action], "--db-url", dbUrl], {
  stdio: ["inherit", "pipe", "pipe"],
});

child.stdout.on("data", (chunk) => process.stdout.write(mask(chunk.toString())));
child.stderr.on("data", (chunk) => process.stderr.write(mask(chunk.toString())));
child.on("close", (code) => process.exit(code ?? 1));
