'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { START, END, BACKUP_SUFFIX, inject, restore, inspect, stripInjection } = require('../core');

function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'clean-agent-rtl-'));
  const file = path.join(directory, 'bundle.js');
  fs.writeFileSync(file, 'const original = true;\n');
  return { directory, file };
}

test('inject creates one backup and a complete marked block', () => {
  const { directory, file } = fixture();
  try {
    assert.equal(inject(file, 'window.runtime = true;', 'auto'), true);
    const state = inspect(file);
    assert.deepEqual(state, { active: true, incomplete: false, backup: true });
    assert.equal(fs.readFileSync(file + BACKUP_SUFFIX, 'utf8'), 'const original = true;\n');
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('reinjection replaces the previous mode instead of stacking blocks', () => {
  const { directory, file } = fixture();
  try {
    inject(file, 'window.runtime = 1;', 'auto');
    inject(file, 'window.runtime = 2;', 'active');
    const content = fs.readFileSync(file, 'utf8');
    assert.equal(content.split(START).length - 1, 1);
    assert.equal(content.split(END).length - 1, 1);
    assert.match(content, /"mode":"active"/);
    assert.doesNotMatch(content, /window\.runtime = 1/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('restore removes only our marked block and preserves later host changes', () => {
  const { directory, file } = fixture();
  try {
    inject(file, 'window.runtime = true;', 'always');
    fs.appendFileSync(file, 'const hostUpdate = true;\n');
    assert.equal(restore(file), true);
    assert.equal(fs.readFileSync(file, 'utf8'), 'const original = true;\nconst hostUpdate = true;\n');
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('an incomplete marker fails closed', () => {
  assert.throws(() => stripInjection(`host\n${START}\nbroken`), /incomplete/);
});
