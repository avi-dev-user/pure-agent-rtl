'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const plan = require('../plan-core');

const original = `<html><head><style>p { color: inherit; }</style></head><body>
<div id="content"></div><textarea id="comment-textarea"></textarea>
<script nonce="x">(function(){ const vscode = acquireVsCodeApi(); vscode.postMessage({ type: 'ready' }); })();</script>
</body></html>`;

function fixture(content = original) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'clean-agent-rtl-plan-'));
  const file = path.join(directory, 'extension.js');
  fs.writeFileSync(file, content);
  return { directory, file };
}

test('injects one CSS and JS block inside the Plan Preview template', () => {
  const { directory, file } = fixture();
  try {
    assert.equal(plan.inject(file, 'auto'), true);
    const content = fs.readFileSync(file, 'utf8');
    assert.deepEqual(plan.inspect(file), { active: true, incomplete: false, backup: true });
    assert.equal(content.split(plan.CSS_START).length - 1, 1);
    assert.equal(content.split(plan.JS_START).length - 1, 1);
    assert.ok(content.indexOf(plan.CSS_START) < content.indexOf('</style>'));
    assert.ok(content.indexOf(plan.JS_START) < content.indexOf("vscode.postMessage({ type: 'ready' });"));
    assert.match(content, /pre, #content code.*direction: ltr !important/);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('reinjection changes mode without stacking and restore preserves host changes', () => {
  const { directory, file } = fixture();
  try {
    plan.inject(file, 'auto');
    plan.inject(file, 'always');
    let content = fs.readFileSync(file, 'utf8');
    assert.equal(content.split(plan.CSS_START).length - 1, 1);
    assert.equal(content.split(plan.JS_START).length - 1, 1);
    assert.match(content, /var mode = "always"/);
    fs.appendFileSync(file, '\nconst hostUpdate = true;');
    assert.equal(plan.restore(file), true);
    assert.equal(fs.readFileSync(file, 'utf8'), original + '\nconst hostUpdate = true;');
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('missing anchors and incomplete markers fail closed', () => {
  const { directory, file } = fixture('const untouched = true;');
  try {
    assert.throws(() => plan.inject(file, 'auto'), /content anchor/);
    assert.equal(fs.readFileSync(file, 'utf8'), 'const untouched = true;');
    assert.throws(() => plan.stripInjection(plan.CSS_START + ' broken'), /incomplete/);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
