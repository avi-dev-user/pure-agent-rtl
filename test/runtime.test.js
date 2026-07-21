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
  assert.match(runtime, /\[class\*="titleGroup_"\]/);
  assert.match(runtime, /\[class\*="titleText_"\]/);
  assert.match(runtime, /\[class\*="titleInput_"\]/);
  assert.match(runtime, /data-clean-rtl-claude-assistant/);
  assert.match(runtime, /style\.width = '100%'/);
  assert.match(runtime, /style\.alignSelf = value === 'rtl' \? 'flex-end' : 'flex-start'/);
  assert.match(runtime, /data-clean-rtl-claude-title-button/);
  assert.match(runtime, /style\.justifyContent = 'flex-start'/);
  assert.match(runtime, /1px solid var\(--vscode-focusBorder, #3794ff\)/);
  assert.match(runtime, /1px solid transparent/);
  assert.match(runtime, /else setDirection\(target, 'ltr', APPLIED\)/);
  assert.match(runtime, /\[class\*="mentionMirror_"\]/);
  assert.match(runtime, /setDirection\(input, 'ltr', INPUT, 'normal'\)/);
  assert.match(runtime, /setDirection\(mirror, value, INPUT, 'normal'\)/);
  assert.match(runtime, /else setDirection\(title, 'ltr', APPLIED\)/);
});
