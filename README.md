# Pure Agent RTL

Clean right-to-left text support for AI coding chats in Visual Studio Code — without recoloring messages, adding borders, or redesigning the interface.

[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/AviDev.pure-agent-rtl?label=Marketplace)](https://marketplace.visualstudio.com/items?itemName=AviDev.pure-agent-rtl)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/AviDev.pure-agent-rtl)](https://marketplace.visualstudio.com/items?itemName=AviDev.pure-agent-rtl)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/AviDev.pure-agent-rtl)](https://marketplace.visualstudio.com/items?itemName=AviDev.pure-agent-rtl)
[![GitHub release](https://img.shields.io/github/v/release/avi-dev-user/pure-agent-rtl)](https://github.com/avi-dev-user/pure-agent-rtl/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Install from the Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=AviDev.pure-agent-rtl) · [GitHub](https://github.com/avi-dev-user/pure-agent-rtl) · [Latest release](https://github.com/avi-dev-user/pure-agent-rtl/releases/latest) · [Report an issue](https://github.com/avi-dev-user/pure-agent-rtl/issues)

Pure Agent RTL currently supports:

- OpenAI Codex
- Anthropic Claude Code, including Plan Preview
- Google Gemini Code Assist

> **Compatibility status:** developed and tested on macOS with Visual Studio Code. Codex and Claude Code have been manually verified. Gemini Code Assist support is implemented but has not yet been manually verified. Windows, Linux, Cursor, Antigravity, and Kiro are not currently claimed as tested.

## Why Pure Agent RTL?

AI chat panels often render Hebrew, Arabic, Persian, Urdu, and mixed RTL/LTR text as ordinary left-to-right content. The result is difficult-to-read punctuation, broken alignment, and confusing mixed-language sentences.

Pure Agent RTL changes only text direction and alignment. It deliberately leaves colors, fonts, message containers, navigation, approvals, scrolling, and agent behavior alone.

## Features

| Feature | Behavior |
| --- | --- |
| Per-block direction | Detects RTL or LTR independently for paragraphs, lists, headings, quotes, and table cells |
| Mixed-language text | Uses first-strong-character detection with a safe RTL fallback |
| Composer support | Updates input direction while you type |
| Code safety | Keeps code blocks, inline code, diffs, terminal-like output, labels, and copy controls LTR |
| Tables | Preserves column order and applies direction per cell |
| Conversation UI | Handles RTL titles, headers, and supported chat-history entries |
| Claude Plan Preview | Handles plan prose, tables, code, and the feedback field separately |
| Chat toggle | Adds a small `⇄` direction control in supported chat header actions |
| Automatic repair | Reapplies the marked injection after a supported agent extension is updated |
| Safe removal | Removes only Pure Agent RTL's marked blocks from the current agent files |
| Diagnostics | Reports detected agents, bundle paths, injection integrity, and backup availability |

## Modes

- **Auto** — detects direction independently for every message and input. Recommended.
- **Active** — enables RTL with a per-chat `⇄` toggle.
- **Always** — keeps prose RTL without showing a chat toggle.
- **Inactive** — removes Pure Agent RTL from supported agent bundles.
- **Fix BiDi** — activates the safe mixed-direction behavior used by Active mode.

Click the `RTL: Auto` item in the VS Code status bar, or open the Command Palette and search for `Pure Agent RTL`.

## Installation and first run

Install it from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=AviDev.pure-agent-rtl), or run:

```bash
code --install-extension AviDev.pure-agent-rtl
```

You can also download the latest VSIX from [GitHub Releases](https://github.com/avi-dev-user/pure-agent-rtl/releases/latest).

Then:

1. Allow Pure Agent RTL to activate after VS Code starts.
2. Choose **Auto** from the status bar menu.
3. Run `Developer: Reload Window` when prompted.
4. Open Codex, Claude Code, or Gemini Code Assist normally.

Pure Agent RTL does not create a replacement chat window. It adjusts the existing chat surfaces provided by the supported agent extensions.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `pureAgentRtl.mode` | `auto` | `auto`, `active`, `always`, or `inactive` |
| `pureAgentRtl.codex` | `true` | Enable OpenAI Codex support |
| `pureAgentRtl.claude` | `true` | Enable Claude Code and Plan Preview support |
| `pureAgentRtl.gemini` | `true` | Enable Gemini Code Assist support |

## How it works

VS Code does not provide a public API for one extension to style another extension's private webview. Pure Agent RTL therefore adds a small, clearly marked runtime block to each supported agent's installed webview bundle.

Before the first modification, it creates a safety backup. Reconfiguration replaces the existing marked block instead of stacking copies. Disabling removes only the marked Pure Agent RTL block from the current file, so it does not roll a newly updated agent back to an older backup.

Claude Plan Preview is an independent webview embedded in Claude Code's extension host bundle. It receives separate marked CSS and JavaScript blocks with its own backup and byte-exact restoration path.

Because agent bundles are private implementation details, a future agent update can temporarily break compatibility. Pure Agent RTL fails closed when required anchors are missing instead of modifying an unknown file layout.

## Safety and uninstalling

Before uninstalling, run:

```text
Pure Agent RTL: Disable and Restore
```

Then reload VS Code and uninstall the extension. Backups are retained as safety copies; normal restoration does not overwrite current agent files with potentially outdated backups.

Use `Pure Agent RTL: Diagnostics` if RTL stops working after an agent update.

## Privacy

- No telemetry.
- No analytics.
- No network requests.
- No account, prompt, response, or workspace data is collected.
- All detection and formatting happen locally inside the supported chat webviews.

## Troubleshooting

### Changes are not visible

Run `Developer: Reload Window`, or fully quit and reopen Visual Studio Code.

### RTL stopped working after an agent update

Restart VS Code. Pure Agent RTL scans supported installations on startup and reapplies its marked runtime. If needed, select **Auto** again from the status bar.

### Permission denied

Pure Agent RTL needs write access to the installed agent extension directory under your VS Code profile. Check the ownership and permissions of that directory. Do not run VS Code as root.

### An agent is not detected

Run `Pure Agent RTL: Diagnostics`. A supported agent may have changed its bundle structure; please open a GitHub issue and include the diagnostics output with personal paths removed.

## Development

```bash
npm run check
npm test
npm run package
```

The test suite covers atomic injection, non-stacking reinjection, incomplete-marker protection, preservation of later host changes, Claude Plan Preview anchors, LTR code rules, and byte-safe restoration behavior.

## Contributing

Issues and focused pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md). Please do not include private conversations, tokens, account information, or proprietary agent bundle contents in reports.

## Disclaimer

Pure Agent RTL is an independent community project. It is not affiliated with, endorsed by, or sponsored by Microsoft, OpenAI, Anthropic, or Google. Product names are used only to describe compatibility.

## License

[MIT](LICENSE)

---

## עברית

Pure Agent RTL מוסיף תמיכה נקייה בכיווניות מימין לשמאל לצ׳אטים של Codex, Claude Code ו־Gemini Code Assist בתוך Visual Studio Code.

התוסף מזהה את הכיוון של כל פסקה בנפרד, מטפל במשפטים שמשלבים עברית ואנגלית, ומשאיר קוד, פקודות, diff וטבלאות במבנה התקין שלהם. הוא אינו משנה צבעים, מסגרות, פונטים או התנהגות של הסוכן.

Claude Code כולל גם תמיכה נפרדת ב־Plan Preview ובשדה המשוב שלו. מצב **Auto** הוא המצב המומלץ. לאחר הפעלה או שינוי מצב יש לבצע `Developer: Reload Window`.

התוסף פותח ונבדק ב־macOS. Codex ו־Claude Code נבדקו ידנית; התמיכה ב־Gemini קיימת אך טרם נבדקה ידנית.

## العربية

يضيف Pure Agent RTL دعماً نظيفاً لاتجاه الكتابة من اليمين إلى اليسار في محادثات Codex وClaude Code وGemini Code Assist داخل Visual Studio Code، مع إبقاء الشيفرة والأوامر وكتل الطرفية باتجاه LTR. لا يغيّر الألوان أو الحدود أو تصميم واجهة المحادثة.

تم تطوير الإضافة واختبارها على macOS. تم التحقق يدوياً من Codex وClaude Code، بينما دعم Gemini مطبّق لكنه لم يُختبر يدوياً بعد.

## فارسی

Pure Agent RTL پشتیبانی تمیز راست‌به‌چپ را به گفت‌وگوهای Codex، Claude Code وGemini Code Assist در Visual Studio Code اضافه می‌کند. بلوک‌های کد، فرمان‌ها و خروجی‌های فنی چپ‌به‌راست باقی می‌مانند و ظاهر رابط کاربری تغییر نمی‌کند.

این افزونه روی macOS توسعه و آزمایش شده است. Codex وClaude Code به‌صورت دستی بررسی شده‌اند؛ پشتیبانی Gemini پیاده‌سازی شده اما هنوز به‌صورت دستی آزمایش نشده است.
