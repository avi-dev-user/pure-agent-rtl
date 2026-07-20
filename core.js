'use strict';

const fs = require('fs');
const path = require('path');

const START = '/* CLEAN-AGENT-RTL:START */';
const END = '/* CLEAN-AGENT-RTL:END */';
const BACKUP_SUFFIX = '.clean-agent-rtl.backup';

function stripInjection(content) {
  const start = content.indexOf(START);
  if (start < 0) return content;
  const end = content.indexOf(END, start);
  if (end < 0) {
    throw new Error('Found an incomplete Clean Agent RTL marker; file was not changed.');
  }
  let before = content.slice(0, start);
  let after = content.slice(end + END.length);
  if (before.endsWith('\n')) before = before.slice(0, -1);
  if (after.startsWith('\n')) after = after.slice(1);
  const clean = before + after;
  return clean.endsWith('\n') ? clean : clean + '\n';
}

function atomicWrite(file, content) {
  const temporary = path.join(path.dirname(file), `.${path.basename(file)}.clean-rtl-${process.pid}-${Date.now()}`);
  const mode = fs.statSync(file).mode;
  try {
    fs.writeFileSync(temporary, content, { encoding: 'utf8', mode });
    fs.renameSync(temporary, file);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

function inject(file, runtime, mode) {
  const current = fs.readFileSync(file, 'utf8');
  const clean = stripInjection(current);
  const backup = file + BACKUP_SUFFIX;
  if (!fs.existsSync(backup)) fs.copyFileSync(file, backup);
  const runtimeConfig = `window.__CLEAN_AGENT_RTL_CONFIG__ = ${JSON.stringify({ mode })};`;
  const output = `${clean}\n${START}\n${runtimeConfig}\n${runtime}\n${END}\n`;
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

module.exports = { START, END, BACKUP_SUFFIX, stripInjection, atomicWrite, inject, restore, inspect };
