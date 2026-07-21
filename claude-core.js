'use strict';

const fs = require('fs');
const { atomicWrite } = require('./core');

const START = '<!-- CLEAN-AGENT-RTL-CLAUDE-CHAT:START -->';
const END = '<!-- CLEAN-AGENT-RTL-CLAUDE-CHAT:END -->';
const LEGACY_START = '/* CLEAN-AGENT-RTL-CLAUDE-CHAT:START */';
const LEGACY_END = '/* CLEAN-AGENT-RTL-CLAUDE-CHAT:END */';
const BACKUP_SUFFIX = '.clean-agent-rtl-claude-chat.backup';
const SCRIPT_ANCHOR = '<script nonce="${u}" src="${a}" type="module"></script>';

function removeMarkedBlock(content, startMarker, endMarker) {
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);
  if ((start >= 0) !== (end >= 0) || (start >= 0 && end < start)) {
    throw new Error('Found incomplete Pure Agent RTL Claude chat markers; file was not changed.');
  }
  if (start < 0) return content;
  let to = end + endMarker.length;
  if (content[to] === '\n') to += 1;
  return content.slice(0, start) + content.slice(to);
}

function stripInjection(content) {
  return removeMarkedBlock(removeMarkedBlock(content, START, END), LEGACY_START, LEGACY_END);
}

function escapeForHostTemplate(runtime) {
  return runtime
    .replaceAll('\\', '\\\\')
    .replaceAll('`', '\\`')
    .replaceAll('${', '\\${');
}

function inject(file, runtime, mode) {
  const current = fs.readFileSync(file, 'utf8');
  const clean = stripInjection(current);
  const anchor = clean.indexOf(SCRIPT_ANCHOR);
  if (anchor < 0) throw new Error('Claude chat script anchor was not found; file was not changed.');
  const config = `window.__CLEAN_AGENT_RTL_CONFIG__ = ${JSON.stringify({ mode })};`;
  const inline = `${START}\n<script nonce="\${u}">\n${escapeForHostTemplate(config + '\n' + runtime)}\n</script>\n${END}\n`;
  const output = clean.slice(0, anchor) + inline + clean.slice(anchor);
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
  const start = content.indexOf(START);
  const end = content.indexOf(END);
  return {
    active: start >= 0 && end > start,
    incomplete: (start >= 0) !== (end >= 0),
    backup: fs.existsSync(file + BACKUP_SUFFIX)
  };
}

module.exports = { START, END, LEGACY_START, LEGACY_END, BACKUP_SUFFIX, SCRIPT_ANCHOR, stripInjection, escapeForHostTemplate, inject, restore, inspect };
