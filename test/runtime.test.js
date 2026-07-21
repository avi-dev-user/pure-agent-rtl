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
  assert.match(runtime, /data-clean-rtl-claude-assistant/);
  assert.match(runtime, /style\.width = '100%'/);
  assert.match(runtime, /style\.alignSelf = value === 'rtl' \? 'flex-end' : 'flex-start'/);
});
