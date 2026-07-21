# Changelog

All notable changes to Pure Agent RTL are documented here.

## 1.1.3 — 2026-07-21

- Fixed a blank Claude Code view after the Claude Code 2.1.216 update.
- Escaped the Plan Preview runtime correctly inside Claude's generated JavaScript template.
- Moved Claude chat runtime injection out of `webview/index.js` and into Claude's nonce-bearing generated HTML.
- Added automatic restoration of the legacy Claude bundle injection.
- Added compatibility tests for escaping and byte-exact restoration of Claude's host template.

## 1.1.2 — 2026-07-21

- Updated the MIT copyright holder to the public publisher identity `AviDev`.

## 1.1.1 — 2026-07-21

- Added direct Visual Studio Marketplace, GitHub, release, issue, and CLI installation links.
- Added Marketplace version, install, rating, release, and license badges.
- Corrected the public Marketplace publisher identity to `AviDev`.

## 1.1.0 — 2026-07-21

- Added dedicated RTL support for Claude Code Plan Preview and its feedback composer.
- Added marked, atomic, independently restorable Plan Preview injection.
- Preserved LTR code and table column order inside Plan Preview.
- Improved Codex chat-header toggle placement and chat-history direction.
- Improved code-block wrapper, language-label, and copy-control LTR behavior.
- Added macOS compatibility verification and expanded automated tests.

## 1.0.0 — 2026-07-20

- Initial support for OpenAI Codex, Claude Code, and Gemini Code Assist.
- Added Auto, Active, Always, Fix BiDi, and Inactive modes.
- Added per-agent settings, status-bar controls, diagnostics, backups, and safe restoration.
