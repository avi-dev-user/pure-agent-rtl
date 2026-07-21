(function cleanAgentRtl() {
  'use strict';

  if (window.__cleanAgentRtlLoaded) return;
  window.__cleanAgentRtlLoaded = true;

  const STORAGE_KEY = 'clean-agent-rtl-enabled';
  const APPLIED = 'data-clean-rtl';
  const INPUT = 'data-clean-rtl-input';
  const BUTTON_ID = 'clean-agent-rtl-toggle';
  const MODE = window.__CLEAN_AGENT_RTL_CONFIG__?.mode || 'auto';
  const RTL = /[\u0590-\u05ff\u0600-\u06ff\u0700-\u074f\u0750-\u077f\u0780-\u07bf\u08a0-\u08ff\ufb1d-\ufdff\ufe70-\ufeff]/u;
  const LETTER = /\p{L}/u;

  const contentSelectors = [
    '[data-content-search-unit-key$=":user"] .text-size-chat',
    '[data-content-search-unit-key$=":assistant"] .text-size-chat',
    '[data-content-search-unit-key]',
    'p.text-size-chat',
    'li.text-size-chat',
    '.markdown',
    '.markdown-new-styling',
    '.inline-markdown',
    '.prose',
    '[class*="_markdownContent_"]',
    '[class*="_markdownBlock_"]',
    '[class*="userMessageContainer_"]',
    '[class*="timelineMessage_"]',
    '[data-testid="assistant-message"] > span',
    '[class*="userMessage_"]',
    '.history-item-text',
    '[class*="questionTextLarge_"]',
    '[class*="optionLabel_"]',
    '[class*="optionDescription_"]',
    '[class*="permissionRequest_"] p',
    '[class*="permissionRequest_"] label'
  ];

  const inputSelectors = [
    '.ProseMirror[data-codex-composer="true"]',
    '.ProseMirror[contenteditable="true"]',
    '[contenteditable="true"][role="textbox"]',
    'div[contenteditable="plaintext-only"][role="textbox"][aria-label="Message input"]',
    '.chat-submit-input[contenteditable="plaintext-only"]',
    '[class*="otherInput_"] [contenteditable="plaintext-only"]',
    '[class*="rejectMessageInput_"] [contenteditable="plaintext-only"]',
    '[class*="messageInput_"][contenteditable="true"]'
  ];

  const titleSelectors = [
    '[style*="view-transition-name: header-title"] .truncate',
    '[style*="view-transition-name: header-title"] button > span',
    '[class*="sessionName_"]',
    '[class*="sessionsButtonText_"]',
    '[class*="titleGroup_"]',
    '[class*="titleText_"]',
    '[class*="titleTextInner_"]',
    '[class*="titleInput_"]',
    '.conversation-title',
    '.history-item-title',
    '[data-testid*="conversation-title"]',
    '[data-testid*="thread-title"]'
  ];

  function enabled() {
    if (MODE === 'inactive') return false;
    if (MODE === 'active' || MODE === 'auto') return localStorage.getItem(STORAGE_KEY) !== 'false';
    return true;
  }

  function contentDirection(text) {
    if (MODE === 'auto') return direction(text);
    return enabled() ? 'rtl' : 'ltr';
  }

  function isCode(element) {
    return Boolean(element.closest('pre, code, [class*="codeBlock"], [class*="toolResult"], [class*="terminal"]'));
  }

  function direction(text) {
    let firstStrong = null;
    let rtlLetters = 0;
    let ltrLetters = 0;
    for (const character of (text || '').trim()) {
      if (RTL.test(character)) {
        rtlLetters += 1;
        if (firstStrong === null) firstStrong = 'rtl';
      } else if (LETTER.test(character)) {
        ltrLetters += 1;
        if (firstStrong === null) firstStrong = 'ltr';
      }
    }
    if (firstStrong === 'rtl') return 'rtl';
    const total = rtlLetters + ltrLetters;
    return total > 0 && rtlLetters / total >= 0.3 ? 'rtl' : 'ltr';
  }

  function textWithoutCode(element) {
    const clone = element.cloneNode(true);
    clone.querySelectorAll('pre, code, button, svg, [class*="toolResult"], [class*="terminal"]').forEach(node => node.remove());
    return clone.textContent || '';
  }

  function setDirection(element, value, attribute) {
    if (
      element.getAttribute(attribute) === value &&
      element.getAttribute('dir') === value &&
      element.style.direction === value &&
      element.style.textAlign === (value === 'rtl' ? 'right' : 'left') &&
      element.style.unicodeBidi === 'plaintext'
    ) return false;
    element.setAttribute(attribute, value);
    element.setAttribute('dir', value);
    element.style.direction = value;
    element.style.textAlign = value === 'rtl' ? 'right' : 'left';
    element.style.unicodeBidi = 'plaintext';
    applyClaudeMessageLayout(element, value);
    applyClaudeTitleLayout(element, value);
    return true;
  }

  function applyClaudeMessageLayout(element, value) {
    if (element.matches('[data-testid="assistant-message"] > span')) {
      element.setAttribute('data-clean-rtl-claude-assistant', 'true');
      element.style.width = '100%';
      element.style.display = 'block';
    }
    if (
      element.matches('[class*="userMessage_"]') &&
      !element.matches('[class*="userMessageContainer_"], [class*="userMessageAttachments_"]')
    ) {
      element.setAttribute('data-clean-rtl-claude-user', 'true');
      element.style.alignSelf = value === 'rtl' ? 'flex-end' : 'flex-start';
    }
  }

  function applyClaudeTitleLayout(element, value) {
    if (element.matches('[class*="titleGroup_"]')) {
      element.setAttribute('data-clean-rtl-claude-title-group', 'true');
    }
    if (element.matches('[class*="titleText_"]')) {
      element.setAttribute('data-clean-rtl-claude-title-button', 'true');
      element.style.width = '100%';
      element.style.justifyContent = 'flex-start';
    }
  }

  function clearDirection(element, attribute) {
    if (!element.hasAttribute(attribute)) return false;
    element.removeAttribute(attribute);
    element.removeAttribute('dir');
    element.style.removeProperty('direction');
    element.style.removeProperty('text-align');
    element.style.removeProperty('unicode-bidi');
    if (element.hasAttribute('data-clean-rtl-claude-assistant')) {
      element.removeAttribute('data-clean-rtl-claude-assistant');
      element.style.removeProperty('width');
      element.style.removeProperty('display');
    }
    if (element.hasAttribute('data-clean-rtl-claude-user')) {
      element.removeAttribute('data-clean-rtl-claude-user');
      element.style.removeProperty('align-self');
    }
    if (element.hasAttribute('data-clean-rtl-claude-title-group')) {
      element.removeAttribute('data-clean-rtl-claude-title-group');
    }
    if (element.hasAttribute('data-clean-rtl-claude-title-button')) {
      element.removeAttribute('data-clean-rtl-claude-title-button');
      element.style.removeProperty('width');
      element.style.removeProperty('justify-content');
    }
    return true;
  }

  function processContent() {
    document.querySelectorAll(contentSelectors.join(',')).forEach(container => {
      if (isCode(container)) return;
      const blockSelector = 'p, li, h1, h2, h3, h4, h5, h6, blockquote, summary, dt, dd, td, th';
      const blocks = container.matches(blockSelector)
        ? [container]
        : [...container.querySelectorAll(blockSelector)];
      const targets = blocks.length > 0 ? blocks : [container];
      for (const target of targets) {
        if (isCode(target)) continue;
        if (enabled()) setDirection(target, contentDirection(textWithoutCode(target)), APPLIED);
        else setDirection(target, 'ltr', APPLIED);
      }
      // Claude's assistant Markdown root is a shrink-to-content flex child.
      // Process the root as well as its prose blocks so chat-wide alignment is visible.
      if (container.matches('[data-testid="assistant-message"] > span')) {
        if (enabled()) setDirection(container, contentDirection(textWithoutCode(container)), APPLIED);
        else setDirection(container, 'ltr', APPLIED);
      }
    });

  }

  function processCode() {
    const blockSelector = [
      '[data-markdown-copy="code-block"]',
      'pre',
      '[class*="codeBlock_"]',
      '[class*="code-block"]'
    ].join(',');

    document.querySelectorAll(blockSelector).forEach(block => {
      if (block.getAttribute('dir') !== 'ltr') block.setAttribute('dir', 'ltr');
      if (block.style.direction !== 'ltr') block.style.direction = 'ltr';
      if (block.style.textAlign !== 'left') block.style.textAlign = 'left';
      if (block.style.unicodeBidi !== 'isolate') block.style.unicodeBidi = 'isolate';
    });

    document.querySelectorAll('code').forEach(code => {
      if (code.style.direction !== 'ltr') code.style.direction = 'ltr';
      if (code.style.unicodeBidi !== 'isolate') code.style.unicodeBidi = 'isolate';
    });
  }

  function processInput(input) {
    if (!enabled()) {
      setDirection(input, 'ltr', INPUT);
      return;
    }
    const value = MODE === 'auto' ? direction(input.textContent || '') : 'rtl';
    setDirection(input, value, INPUT);
    if (!input.hasAttribute('data-clean-rtl-listener')) {
      input.setAttribute('data-clean-rtl-listener', 'true');
      input.addEventListener('input', () => processInput(input));
    }
  }

  function processInputs() {
    document.querySelectorAll(inputSelectors.join(',')).forEach(processInput);
  }

  function processTitles() {
    document.querySelectorAll(titleSelectors.join(',')).forEach(title => {
      if (isCode(title)) return;
      if (enabled()) setDirection(title, contentDirection(title.textContent || ''), APPLIED);
      else setDirection(title, 'ltr', APPLIED);
    });
  }

  function updateButton(button) {
    const active = enabled();
    button.textContent = '⇄';
    button.title = active ? 'Disable RTL in this chat' : 'Enable RTL in this chat';
    button.setAttribute('aria-label', `${MODE === 'auto' ? 'Automatic RTL' : 'RTL'}: ${active ? 'enabled' : 'disabled'}`);
    button.setAttribute('aria-pressed', String(active));
    button.style.opacity = active ? '1' : '0.55';
    button.style.border = active
      ? '1px solid var(--vscode-focusBorder, #3794ff)'
      : '1px solid transparent';
    button.style.borderRadius = '4px';
  }

  function findCodexTopActions() {
    const candidates = new Map();
    document.querySelectorAll('button').forEach(button => {
      const rect = button.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || rect.top < 35 || rect.top > 150) return;
      if (rect.right < window.innerWidth * 0.55) return;
      const parent = button.parentElement;
      if (!parent) return;
      candidates.set(parent, (candidates.get(parent) || 0) + 1);
    });
    return [...candidates.entries()]
      .filter(([, count]) => count >= 2)
      .sort((left, right) => right[1] - left[1])[0]?.[0] || null;
  }

  function findHeaderActions(isCodex) {
    if (isCodex) {
      const topActions = findCodexTopActions();
      if (topActions) return topActions;
    }

    const codexTitle = document.querySelector('[style*="view-transition-name: header-title"]');
    if (codexTitle) {
      let ancestor = codexTitle;
      for (let depth = 0; ancestor && depth < 7; depth += 1, ancestor = ancestor.parentElement) {
        if (ancestor.matches('header, [role="toolbar"]') || ancestor.querySelectorAll('button').length >= 2) {
          return ancestor;
        }
      }
    }

    const claudeTitle = document.querySelector('[class*="titleGroup_"], [class*="titleTextInner_"]');
    if (claudeTitle) {
      const header = claudeTitle.closest('[class*="header_"]') || claudeTitle.parentElement?.parentElement;
      const actions = header?.querySelector('[class*="actions_"], [class*="sessionActions_"]');
      if (actions || header) return actions || header;
    }

    return document.querySelector('.gemini-header-colors .action-row, .mat-toolbar .action-row, .mat-toolbar');
  }

  function addButton() {
    if (MODE !== 'active' && MODE !== 'auto') {
      document.getElementById(BUTTON_ID)?.remove();
      return;
    }
    if (document.getElementById(BUTTON_ID)) return;
    const isCodex = Boolean(document.querySelector('.ProseMirror'));
    const input = [...document.querySelectorAll(inputSelectors.join(','))]
      .find(candidate => candidate.getClientRects().length > 0 && candidate.getAttribute('aria-hidden') !== 'true');

    const codexFooter = input?.closest('form, [class*="composer"]')?.querySelector('.composer-footer')
      || document.querySelector('.composer-footer');
    const headerActions = findHeaderActions(isCodex);
    const isCodexConversation = Boolean(document.querySelector('[data-content-search-unit-key], [style*="view-transition-name: header-title"]'));
    if (isCodex && !isCodexConversation && !headerActions) return;
    const host = headerActions || codexFooter || input?.parentElement;
    if (!host) return;

    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.type = 'button';
    button.style.background = 'transparent';
    button.style.border = '1px solid transparent';
    button.style.padding = '2px 6px';
    button.style.minWidth = '28px';
    button.style.height = '28px';
    button.style.display = 'inline-flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.cursor = 'pointer';
    button.style.color = 'inherit';
    button.style.font = 'inherit';
    updateButton(button);
    button.addEventListener('click', () => {
      localStorage.setItem(STORAGE_KEY, enabled() ? 'false' : 'true');
      updateButton(button);
      processAll();
    });
    host.append(button);
  }

  function processAll() {
    processContent();
    processCode();
    processInputs();
    processTitles();
    addButton();
  }

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      processAll();
    });
  });

  function start() {
    processAll();
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.setInterval(processAll, 1000);
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
