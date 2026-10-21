import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const phaseDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => readFileSync(resolve(phaseDir, name), 'utf8');

test('candidate scorecard covers both phone platforms and product/security gates', () => {
  const options = read('01-STACK-OPTIONS.md');

  assert.match(options, /no\s+production stack is approved/i);
  assert.match(options, /Candidate A is approved for a reversible feasibility spike only/i);
  assert.match(options, /Expo.*React Native.*Supabase.*EAS/i);
  assert.match(options, /Flutter.*Supabase/i);

  for (const criterion of [
    /iPhone/i,
    /Android/i,
    /TestFlight/i,
    /Google Play.*internal/i,
    /email.{0,20}password/i,
    /invitation/i,
    /family.scope|family membership/i,
    /bilingual/i,
    /offline.*read.only/i,
    /cache.*purge/i,
    /local full.stack/i,
    /pass.*fail/i,
  ]) {
    assert.match(options, criterion);
  }
});

test('source audit traces phase requirements, decisions, probes, and phase boundaries', () => {
  const audit = read('01-SOURCE-AUDIT.md');

  for (const requirement of [
    'AUTH-01',
    'AUTH-02',
    'AUTH-03',
    'AUTH-04',
    'RECP-01',
    'RECP-03',
  ]) {
    assert.match(audit, new RegExp(requirement));
  }

  for (let decision = 1; decision <= 21; decision += 1) {
    assert.match(audit, new RegExp(`D-${String(decision).padStart(2, '0')}`));
  }

  const probeSection = audit.split('## Spec-less edge-probe assumptions')[1];
  assert.ok(probeSection, 'edge-probe section must exist');
  assert.equal((probeSection.match(/^\| (?:AUTH|RECP)-\d+ \|/gm) ?? []).length, 9);
  assert.match(audit, /Phase 2 boundary/i);
  assert.match(audit, /Phase 3 boundary/i);
  assert.match(audit, /D-14/);
  assert.match(audit, /D-15/);
});

test('plan mappings point to the plans that implement recipe and account-deletion decisions', () => {
  const audit = read('01-SOURCE-AUDIT.md');
  const row = (key) => audit.split(/\r?\n/).find((line) => line.includes(`| ${key} |`));

  assert.match(row('RECP-03'), /01-05/);
  assert.match(row('D-11'), /01-05/);
  assert.match(row('D-17'), /01-06/);
  assert.match(
    audit.split(/\r?\n/).find((line) => line.includes('regular-member retention/anonymization')),
    /01-06/,
  );
});
