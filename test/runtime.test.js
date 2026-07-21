'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const runtime = fs.readFileSync(path.join(__dirname, '..', 'rtl-webview.js'), 'utf8');

test('includes stable Claude message and current composer selectors', () => {
  assert.match(runtime, /\[data-testid="assistant-message"\] > span/);
  assert.match(runtime, /\[class\*="userMessage_"\]/);
  assert.match(runtime, /\[class\*="messageInput_"\]\[contenteditable="true"\]/);
});
