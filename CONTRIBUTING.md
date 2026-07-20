# Contributing

Thanks for helping improve Pure Agent RTL.

## Before opening an issue

1. Update Visual Studio Code and the affected agent extension.
2. Restart VS Code and reselect **Auto** mode.
3. Run `Pure Agent RTL: Diagnostics`.
4. Remove usernames and personal filesystem paths before sharing diagnostics.

Never attach private chats, API keys, access tokens, credentials, or complete proprietary agent bundles.

## Development checks

```bash
npm run check
npm test
npm run package
```

Changes should remain narrowly scoped to text direction. Avoid visual restyling, agent behavior changes, network access, telemetry, and selectors broader than necessary.

When adding support for a new bundle layout, include a fixture-based test and ensure unknown layouts fail closed.
