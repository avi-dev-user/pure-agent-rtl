'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const claude = require('../claude-core');

const original = 'return`<body>\n<script nonce="${u}" src="${a}" type="module"></script>\n</body>`;\n';

function fixture(content = original) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pure-agent-rtl-claude-'));
  const file = path.join(directory, 'extension.js');
  fs.writeFileSync(file, content);
  return { directory, file };
}

test('injects a nonce-bearing inline runtime before Claude module', () => {
  const { directory, file } = fixture();
  try {
    claude.inject(file, 'const regex = /\\p{L}/u; const label = `${regex}`;', 'auto');
    const content = fs.readFileSync(file, 'utf8');
    assert.deepEqual(claude.inspect(file), { active: true, incomplete: false, backup: true });
    assert.ok(content.indexOf(claude.START) < content.indexOf(claude.SCRIPT_ANCHOR));
    assert.match(content, /<script nonce="\$\{u\}">/);
    assert.match(content, /<!-- CLEAN-AGENT-RTL-CLAUDE-CHAT:START -->/);
    assert.match(content, /"mode":"auto"/);
    assert.match(content, /\\\\p\{L\}/);
    assert.match(content, /\\`\\\$\{regex\}\\`/);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('migrates the previously visible JavaScript comment markers', () => {
  const legacy = original.replace(claude.SCRIPT_ANCHOR, `${claude.LEGACY_START}\n<script nonce="\${u}">old</script>\n${claude.LEGACY_END}\n${claude.SCRIPT_ANCHOR}`);
  const { directory, file } = fixture(legacy);
  try {
    claude.inject(file, 'window.fixed = true;', 'auto');
    const content = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(content, /\/\* CLEAN-AGENT-RTL-CLAUDE-CHAT/);
    assert.equal(content.split(claude.START).length - 1, 1);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('reinjection does not stack and restoration is byte exact', () => {
  const { directory, file } = fixture();
  try {
    claude.inject(file, 'window.one = true;', 'auto');
    claude.inject(file, 'window.two = true;', 'always');
    const content = fs.readFileSync(file, 'utf8');
    assert.equal(content.split(claude.START).length - 1, 1);
    assert.doesNotMatch(content, /window\.one/);
    assert.match(content, /window\.two/);
    assert.equal(claude.restore(file), true);
    assert.equal(fs.readFileSync(file, 'utf8'), original);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('missing anchor and incomplete markers fail closed', () => {
  const { directory, file } = fixture('const untouched = true;');
  try {
    assert.throws(() => claude.inject(file, 'x', 'auto'), /anchor/);
    assert.equal(fs.readFileSync(file, 'utf8'), 'const untouched = true;');
    assert.throws(() => claude.stripInjection(claude.START + ' broken'), /incomplete/);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
