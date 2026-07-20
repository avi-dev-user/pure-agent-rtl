# Security Policy

## Reporting a vulnerability

Please do not disclose vulnerabilities in a public issue. Use GitHub's private vulnerability reporting feature for this repository.

Do not include real credentials, private conversations, or proprietary extension bundles in a report. Minimal synthetic reproduction material is preferred.

## Local modifications

Pure Agent RTL modifies supported extensions' installed webview bundles because VS Code does not expose their private DOM through a public API. Every modification is marked, backed up, written atomically, and designed to fail closed when an expected anchor is missing.
