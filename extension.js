'use strict';

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');
const core = require('./core');
const planCore = require('./plan-core');

function config() {
  return vscode.workspace.getConfiguration('pureAgentRtl');
}

function extensionRoots() {
  const home = os.homedir();
  return [
    path.join(home, '.vscode', 'extensions'),
    path.join(home, '.vscode-insiders', 'extensions'),
    path.join(home, '.cursor', 'extensions'),
    path.join(home, '.antigravity', 'extensions'),
    path.join(home, '.antigravity-ide', 'extensions'),
    path.join(home, '.kiro', 'extensions')
  ];
}

function resolveCodexBundle(extensionDir) {
  const htmlPath = path.join(extensionDir, 'webview', 'index.html');
  if (!fs.existsSync(htmlPath)) return null;
  const html = fs.readFileSync(htmlPath, 'utf8');
  const scripts = [...html.matchAll(/<script[^>]+src=["']\.\/([^"']+\.js)["']/gi)];
  if (scripts.length === 0) return null;
  return path.join(extensionDir, 'webview', scripts.at(-1)[1].replaceAll('/', path.sep));
}

function installations() {
  const definitions = [
    {
      agent: 'claude',
      prefix: 'anthropic.claude-code-',
      resolve: dir => path.join(dir, 'webview', 'index.js')
    },
    {
      agent: 'codex',
      prefix: 'openai.chatgpt-',
      resolve: resolveCodexBundle
    },
    {
      agent: 'gemini',
      prefix: 'google.geminicodeassist-',
      resolve: dir => path.join(dir, 'webview', 'app_bundle.js')
    }
  ];

  const found = [];
  for (const root of extensionRoots()) {
    if (!fs.existsSync(root)) continue;
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      for (const definition of definitions) {
        if (!entry.name.startsWith(definition.prefix)) continue;
        const extensionDir = path.join(root, entry.name);
        const bundle = definition.resolve(extensionDir);
        if (bundle && fs.existsSync(bundle)) {
          found.push({ agent: definition.agent, name: entry.name, bundle, extensionDir });
        }
      }
    }
  }
  return found;
}

function restartNotice(message) {
  vscode.window.showInformationMessage(message, 'Restart Extension Host', 'Reload Window').then(choice => {
    if (choice === 'Restart Extension Host') {
      vscode.commands.executeCommand('workbench.action.restartExtensionHost');
    } else if (choice === 'Reload Window') {
      vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
  });
}

function enable(context, mode, quiet = false) {
  const runtime = fs.readFileSync(path.join(context.extensionPath, 'rtl-webview.js'), 'utf8');
  const targets = installations();
  const settings = config();
  let changed = 0;
  for (const target of targets) {
    const selected = settings.get(target.agent, true);
    if (selected && core.inject(target.bundle, runtime, mode)) changed += 1;
    if (!selected && core.restore(target.bundle)) changed += 1;
    if (target.agent === 'claude') {
      const planFile = path.join(target.extensionDir, 'extension.js');
      if (selected && planCore.inject(planFile, mode)) changed += 1;
      if (!selected && planCore.restore(planFile)) changed += 1;
    }
  }
  if (quiet && changed > 0) {
      restartNotice(`Pure Agent RTL (${mode}) is ready for ${changed} agent installation(s).`);
  } else if (!quiet) {
    if (targets.length === 0) {
      vscode.window.showWarningMessage('Pure Agent RTL: no supported agent extensions were found.');
    } else if (changed > 0) {
      restartNotice(`Pure Agent RTL (${mode}) enabled for ${changed} agent installation(s).`);
    } else {
      vscode.window.showInformationMessage('Pure Agent RTL is already enabled.');
    }
  }
}

function disable() {
  let changed = 0;
  for (const target of installations()) {
    if (core.restore(target.bundle)) changed += 1;
    if (target.agent === 'claude' && planCore.restore(path.join(target.extensionDir, 'extension.js'))) changed += 1;
  }
  if (changed > 0) {
    restartNotice(`Pure Agent RTL removed from ${changed} agent installation(s).`);
  } else {
    vscode.window.showInformationMessage('Pure Agent RTL: no active injections were found.');
  }
}

function showStatus() {
  const mode = config().get('mode', 'auto');
  const targets = installations();
  const lines = targets.map(target => {
    const state = core.inspect(target.bundle);
    return `${target.agent}: ${state.active ? 'enabled' : 'disabled'} — ${target.name}`;
  });
  const details = lines.length ? lines.join('\n') : 'No supported agent extensions found.';
  vscode.window.showInformationMessage(`Mode: ${mode}\n${details}`);
}

let diagnosticsOutput;

function diagnostics() {
  if (!diagnosticsOutput) diagnosticsOutput = vscode.window.createOutputChannel('Pure Agent RTL Diagnostics');
  diagnosticsOutput.clear();
  diagnosticsOutput.appendLine(`Pure Agent RTL ${vscode.extensions.getExtension('AviDev.pure-agent-rtl')?.packageJSON.version || ''}`);
  diagnosticsOutput.appendLine(`Mode: ${config().get('mode', 'auto')}`);
  diagnosticsOutput.appendLine(`IDE: ${vscode.env.appName}`);
  diagnosticsOutput.appendLine('');
  const targets = installations();
  if (targets.length === 0) diagnosticsOutput.appendLine('No supported agent installations found.');
  for (const target of targets) {
    const state = core.inspect(target.bundle);
    diagnosticsOutput.appendLine(`${target.agent} — ${target.name}`);
    diagnosticsOutput.appendLine(`  selected: ${config().get(target.agent, true)}`);
    diagnosticsOutput.appendLine(`  injection: ${state.active ? 'complete' : state.incomplete ? 'INCOMPLETE' : 'absent'}`);
    diagnosticsOutput.appendLine(`  backup: ${state.backup ? 'present' : 'absent'}`);
    diagnosticsOutput.appendLine(`  bundle: ${target.bundle}`);
    if (target.agent === 'claude') {
      const planFile = path.join(target.extensionDir, 'extension.js');
      const planState = planCore.inspect(planFile);
      diagnosticsOutput.appendLine(`  Plan Preview: ${planState.active ? 'enabled' : planState.incomplete ? 'INCOMPLETE' : 'disabled'}`);
      diagnosticsOutput.appendLine(`  Plan backup: ${planState.backup ? 'present' : 'absent'}`);
    }
  }
  diagnosticsOutput.show(true);
}

let statusBar;

function updateStatusBar() {
  if (!statusBar) return;
  const mode = config().get('mode', 'auto');
  const icons = { active: '$(arrow-swap)', always: '$(pin)', auto: '$(eye)', inactive: '$(circle-slash)' };
  statusBar.text = `${icons[mode] || '$(globe)'} RTL: ${mode[0].toUpperCase()}${mode.slice(1)}`;
  statusBar.tooltip = 'Pure Agent RTL — click to choose a mode';
}

async function setMode(context, mode, options = {}) {
  await config().update('mode', mode, vscode.ConfigurationTarget.Global);
  updateStatusBar();
  if (mode === 'inactive') {
    disable();
    return;
  }
  enable(context, mode, options.quiet === true);
}

async function showMenu(context) {
  const choice = await vscode.window.showQuickPick([
    { label: '$(eye) Auto', description: 'Detect direction per message (recommended)', mode: 'auto' },
    { label: '$(arrow-swap) Active', description: 'Show a ⇄ toggle inside each chat', mode: 'active' },
    { label: '$(pin) Always', description: 'Keep prose RTL without a chat toggle', mode: 'always' },
    { label: '$(tools) Fix BiDi', description: 'Use Active mode with safe mixed-direction handling', mode: 'active' },
    { label: '$(circle-slash) Inactive', description: 'Remove RTL and restore the original UI', mode: 'inactive' },
    { label: '$(info) Status', description: 'Show detected agents and injection state', command: 'status' },
    { label: '$(output) Diagnostics', description: 'Open detailed agent and bundle diagnostics', command: 'diagnostics' }
  ], { placeHolder: 'Choose Pure Agent RTL mode' });
  if (!choice) return;
  if (choice.command === 'status') showStatus();
  else if (choice.command === 'diagnostics') diagnostics();
  else setMode(context, choice.mode);
}

function activate(context) {
  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
  statusBar.command = 'pureAgentRtl.menu';
  updateStatusBar();
  statusBar.show();
  context.subscriptions.push(
    statusBar,
    vscode.commands.registerCommand('pureAgentRtl.menu', () => showMenu(context)),
    vscode.commands.registerCommand('pureAgentRtl.active', () => setMode(context, 'active')),
    vscode.commands.registerCommand('pureAgentRtl.always', () => setMode(context, 'always')),
    vscode.commands.registerCommand('pureAgentRtl.auto', () => setMode(context, 'auto')),
    vscode.commands.registerCommand('pureAgentRtl.fixBidi', () => setMode(context, 'active')),
    vscode.commands.registerCommand('pureAgentRtl.disable', () => setMode(context, 'inactive')),
    vscode.commands.registerCommand('pureAgentRtl.status', showStatus),
    vscode.commands.registerCommand('pureAgentRtl.diagnostics', diagnostics),
    vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('pureAgentRtl')) updateStatusBar();
    })
  );

  const mode = config().get('mode', 'auto');
  if (mode !== 'inactive') {
    try {
      enable(context, mode, true);
    } catch (error) {
      vscode.window.showWarningMessage(`Pure Agent RTL could not start: ${error.message}`);
    }
  }
}

function deactivate() {}

module.exports = { activate, deactivate };
