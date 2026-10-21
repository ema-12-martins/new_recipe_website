import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const phaseDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const evidence = readFileSync(
  resolve(phaseDir, '01-PLATFORM-EVIDENCE.md'),
  'utf8',
);

function platformSection(platform, nextHeading) {
  const start = evidence.indexOf(`## ${platform}`);
  assert.notEqual(start, -1, `${platform} evidence section must exist`);
  const end = nextHeading ? evidence.indexOf(nextHeading, start) : evidence.length;
  assert.notEqual(end, -1, `${nextHeading} heading must exist`);
  return evidence.slice(start, end);
}

function evidenceRows(section) {
  return section
    .split(/\r?\n/)
    .filter((line) => /^\| [^|]+ \| (?:PASS|FAIL|NOT RUN) \| [^|]+ \|$/.test(line));
}

test('iPhone and Android each have a separate explicit result for every required case', () => {
  const iphone = platformSection('iPhone', '## Android');
  const android = platformSection('Android', '## Local Environment Constraints');
  const iphoneRows = evidenceRows(iphone);
  const androidRows = evidenceRows(android);

  assert.equal(iphoneRows.length, 12, 'iPhone must enumerate all required cases');
  assert.equal(androidRows.length, 12, 'Android must enumerate all required cases');
  const iphoneCases = iphoneRows.map((row) => row.split('|')[1].trim());
  const androidCases = androidRows.map((row) => row.split('|')[1].trim());
  assert.match(iphoneCases[0], /TestFlight/);
  assert.match(androidCases[0], /Google Play.*test-track/);
  assert.deepEqual(
    iphoneCases.slice(1),
    androidCases.slice(1),
    'both platforms must cover the same product cases in the same order',
  );
});

test('a PASS result must cite a concrete evidence artifact', () => {
  for (const platform of ['iPhone', 'Android']) {
    const section = platformSection(
      platform,
      platform === 'iPhone' ? '## Android' : '## Local Environment Constraints',
    );
    for (const row of evidenceRows(section)) {
      if (row.includes('| PASS |')) {
        const reference = row.split('|')[3].trim();
        assert.doesNotMatch(
          reference,
          /none|not run|not recorded|no .*access|no .*configured/i,
          `${platform} PASS must reference an actual artifact`,
        );
      }
    }
  }
});

test('unperformed device and product-flow checks remain NOT RUN, not inferred passes', () => {
  for (const platform of ['iPhone', 'Android']) {
    const section = platformSection(
      platform,
      platform === 'iPhone' ? '## Android' : '## Local Environment Constraints',
    );
    assert.equal(
      evidenceRows(section).filter((row) => row.includes('| NOT RUN |')).length,
      12,
      `${platform} cases without device, backend, and account access must stay NOT RUN`,
    );
    assert.doesNotMatch(section, /\| PASS \|/);
  }
});
