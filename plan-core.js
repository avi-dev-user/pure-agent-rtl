'use strict';

const fs = require('fs');
const { atomicWrite } = require('./core');
const { escapeForHostTemplate } = require('./claude-core');

const CSS_START = '/* CLEAN-AGENT-RTL-PLAN:CSS:START */';
const CSS_END = '/* CLEAN-AGENT-RTL-PLAN:CSS:END */';
const JS_START = '/* CLEAN-AGENT-RTL-PLAN:JS:START */';
const JS_END = '/* CLEAN-AGENT-RTL-PLAN:JS:END */';
const BACKUP_SUFFIX = '.clean-agent-rtl-plan.backup';
const CONTENT_ANCHOR = '<div id="content"></div>';
const READY_ANCHOR = "vscode.postMessage({ type: 'ready' });";

function removeBlock(content, startMarker, endMarker) {
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);
  if ((start >= 0) !== (end >= 0) || (start >= 0 && end < start)) {
    throw new Error('Found incomplete Clean Agent RTL Plan markers; file was not changed.');
  }
  if (start < 0) return content;
  const from = start;
  let to = end + endMarker.length;
  if (content[to] === '\n') to += 1;
  return content.slice(0, from) + content.slice(to);
}

function stripInjection(content) {
  return removeBlock(removeBlock(content, CSS_START, CSS_END), JS_START, JS_END);
}

function cssBlock() {
  return `${CSS_START}
#content [dir="rtl"], #comment-input [dir="rtl"] { direction: rtl; text-align: right; unicode-bidi: plaintext; }
#content [dir="ltr"], #comment-input [dir="ltr"] { direction: ltr; text-align: left; unicode-bidi: plaintext; }
#content pre, #content code, #content kbd, #content samp { direction: ltr !important; text-align: left !important; unicode-bidi: isolate !important; }
#clean-agent-rtl-plan-toggle { float: right; border: 0; background: transparent; color: inherit; cursor: pointer; font: inherit; padding: 0 2px; opacity: .8; }
#clean-agent-rtl-plan-toggle:hover { opacity: 1; }
${CSS_END}`;
}

function jsBlock(mode) {
  return `${JS_START}
(function cleanAgentRtlPlan() {
  var mode = ${JSON.stringify(mode)};
  var storageKey = 'clean-agent-rtl-plan-direction';
  var selector = 'p,li,h1,h2,h3,h4,h5,h6,blockquote,summary,dt,dd,td,th,figcaption,caption';
  var rtl = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/g;
  var strongLtr = /[A-Za-z\u00C0-\u02AF]/;
  var scheduled = false;

  function detectedDirection(text) {
    var value = String(text || '').replace(/https?:\\/\\/\\S+|\`[^\`]*\`/g, ' ').trim();
    if (!value) return 'ltr';
    for (var i = 0; i < value.length; i++) {
      if (rtl.test(value[i])) { rtl.lastIndex = 0; return 'rtl'; }
      rtl.lastIndex = 0;
      if (strongLtr.test(value[i])) return 'ltr';
    }
    var matches = value.match(rtl);
    return matches && matches.length / Math.max(value.replace(/\\s/g, '').length, 1) >= 0.3 ? 'rtl' : 'ltr';
  }

  function requestedDirection(text) {
    if (mode === 'always') return 'rtl';
    if (mode === 'active') return localStorage.getItem(storageKey) || 'rtl';
    return detectedDirection(text);
  }

  function apply() {
    scheduled = false;
    var root = document.getElementById('content');
    if (!root) return;
    var blocks = root.querySelectorAll(selector);
    for (var i = 0; i < blocks.length; i++) {
      if (blocks[i].closest('pre,code,kbd,samp')) continue;
      var dir = requestedDirection(blocks[i].textContent);
      if (blocks[i].getAttribute('dir') !== dir) blocks[i].setAttribute('dir', dir);
    }
    var textarea = document.getElementById('comment-textarea');
    if (textarea) {
      var inputDir = requestedDirection(textarea.value);
      if (textarea.getAttribute('dir') !== inputDir) textarea.setAttribute('dir', inputDir);
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(apply);
  }

  function addToggle() {
    if (mode !== 'active' && mode !== 'auto') return;
    if (document.getElementById('clean-agent-rtl-plan-toggle')) return;
    var button = document.createElement('button');
    button.id = 'clean-agent-rtl-plan-toggle';
    button.type = 'button';
    button.textContent = '\u21c4';
    button.title = 'Toggle RTL / LTR';
    button.setAttribute('aria-label', 'Toggle RTL / LTR');
    button.addEventListener('click', function() {
      var current = localStorage.getItem(storageKey) || 'rtl';
      localStorage.setItem(storageKey, current === 'rtl' ? 'ltr' : 'rtl');
      mode = 'active';
      apply();
    });
    var banner = document.getElementById('comment-banner');
    if (banner) banner.insertBefore(button, banner.firstChild);
  }

  addToggle();
  var root = document.getElementById('content');
  if (root) new MutationObserver(schedule).observe(root, { childList: true, subtree: true, characterData: true });
  var textarea = document.getElementById('comment-textarea');
  if (textarea) textarea.addEventListener('input', schedule);
  apply();
})();
${JS_END}`;
}

function inject(file, mode) {
  const current = fs.readFileSync(file, 'utf8');
  let output = stripInjection(current);
  const contentIndex = output.indexOf(CONTENT_ANCHOR);
  if (contentIndex < 0) throw new Error('Claude Plan Preview content anchor was not found; file was not changed.');
  const styleIndex = output.lastIndexOf('</style>', contentIndex);
  if (styleIndex < 0) throw new Error('Claude Plan Preview style anchor was not found; file was not changed.');
  output = output.slice(0, styleIndex) + cssBlock() + '\n' + output.slice(styleIndex);
  const readyIndex = output.indexOf(READY_ANCHOR, contentIndex);
  if (readyIndex < 0) throw new Error('Claude Plan Preview ready anchor was not found; file was not changed.');
  output = output.slice(0, readyIndex) + escapeForHostTemplate(jsBlock(mode)) + '\n' + output.slice(readyIndex);
  if (!fs.existsSync(file + BACKUP_SUFFIX)) fs.copyFileSync(file, file + BACKUP_SUFFIX);
  if (output !== current) atomicWrite(file, output);
  return output !== current;
}

function restore(file) {
  const current = fs.readFileSync(file, 'utf8');
  const clean = stripInjection(current);
  if (clean === current) return false;
  atomicWrite(file, clean);
  return true;
}

function inspect(file) {
  const content = fs.readFileSync(file, 'utf8');
  const cssStart = content.indexOf(CSS_START);
  const cssEnd = content.indexOf(CSS_END);
  const jsStart = content.indexOf(JS_START);
  const jsEnd = content.indexOf(JS_END);
  return {
    active: cssStart >= 0 && cssEnd > cssStart && jsStart >= 0 && jsEnd > jsStart,
    incomplete: (cssStart >= 0) !== (cssEnd >= 0) || (jsStart >= 0) !== (jsEnd >= 0),
    backup: fs.existsSync(file + BACKUP_SUFFIX)
  };
}

module.exports = { CSS_START, CSS_END, JS_START, JS_END, BACKUP_SUFFIX, stripInjection, inject, restore, inspect };
