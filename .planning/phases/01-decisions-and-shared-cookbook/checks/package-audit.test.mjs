import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const phaseDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => readFileSync(resolve(phaseDir, name), 'utf8');

test('package installation stays gated by a complete audit of the approved spike candidate', () => {
  const research = read('01-RESEARCH.md');
  const options = read('01-STACK-OPTIONS.md');
  const coverage = read('COVERAGE.md');
  const auditStart = research.indexOf('## Package Legitimacy Audit');

  assert.notEqual(auditStart, -1, 'package legitimacy audit section must exist');
  const audit = research.slice(auditStart).split(/\n## /, 1)[0];

  assert.match(options, /Candidate A is approved for a reversible feasibility spike only/i);
  assert.match(research, /no package has been installed yet/i);
  assert.match(research, /user explicitly approved the required package identities and CLI tooling/i);
  assert.match(coverage, /human package-legitimacy checkpoint approved the required spike package identities and CLI tools/i);
  assert.match(research, /no package has been installed yet/i);

  const packageRows = audit
    .split(/\r?\n/)
    .filter((line) => /^\|\s*`?@?[a-z0-9][^|]*`?\s*\|/i.test(line))
    .filter((line) => !/^\|\s*package\b/i.test(line));

  assert.ok(packageRows.length > 0, 'approved candidate must have audited package rows');
  for (const row of packageRows) {
    assert.match(row, /\|\s*[^|]*(?:npm|official registry)[^|]*\|/i);
    assert.match(row, /\|\s*[^|]*(?:official|source|maintainer)[^|]*\|/i);
    assert.match(row, /\|\s*\[(?:LEGIT|ASSUMED|SUS|SLOP)\][^|]*\|/i);
    assert.match(row, /\|\s*[^|]+\|\s*$/);
    assert.doesNotMatch(row, /\[SLOP\]/i, 'slop packages cannot be approved for installation');
  }

  for (const decision of ['D-17', 'D-18', 'D-19', 'D-20', 'D-21']) {
    assert.match(research, new RegExp(decision));
  }
  for (const question of [
    /Account deletion versus shared recipes/,
    /Offline revocation/,
    /Invitation lifecycle/,
    /Portuguese\/English/,
    /Mobile test access/,
    /Recipe cleanup granularity/,
  ]) {
    assert.match(research, question);
  }
  assert.match(research, /D-16 reports a current iPhone, Android phone, and Apple\/Google developer accounts are available/);
  assert.match(research, /Cookbook-owner deletion remains unresolved and is a blocking human decision in Plan 01-06/);
  assert.match(coverage, /Supabase Auth/);
  assert.match(coverage, /Row Level Security/);
  assert.match(coverage, /Expo SQLite/);
  assert.match(coverage, /Apple Developer.*TestFlight/);
  assert.match(coverage, /Google Play Console internal\/closed testing/);
  assert.match(coverage, /OCR, image import.*OPT-OUT/);
  assert.match(coverage, /Search and category APIs.*OPT-OUT/);
});
