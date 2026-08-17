# Security Policy

## Supported Versions

Tyler's Light is an early-stage open-source project. Security fixes are
applied to the `main` branch only. There are no long-term-support versions
yet.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Report privately by:

1. Emailing `security@aeventures.com` (preferred), or
2. Opening a [private security advisory](https://github.com/AEVentures/tylers-light/security/advisories/new) on GitHub.

Please include:

- A description of the vulnerability and its potential impact.
- Steps to reproduce or proof-of-concept code.
- The version, commit hash, or environment where you observed the issue.
- Whether you would like public credit after a fix ships.

We will acknowledge receipt within 72 hours and aim to provide a mitigation
or fix within 14 days for high-severity issues. We will coordinate a
disclosure timeline with you before publishing details.

## Reporting incorrect or unsafe content

This is a suicide-prevention resource, so accuracy and safe messaging matter
as much as code security. If you find:

- An incorrect or outdated crisis-line number,
- Content that violates our [safe-messaging guidelines](docs/SAFE_MESSAGING.md), or
- Personal information published without consent,

please report it the same way as a security vulnerability — privately, so
it can be fixed before wider exposure.

## Scope

In scope:

- The Tyler's Light website (deployed via GitHub Pages).
- The `AEVentures/tylers-light` repository, including its build and
  deployment pipeline.

Out of scope:

- Third-party services we link to (report to those vendors directly).
- Social engineering of maintainers.
- Denial-of-service attacks against the public site.

## Handling of Sensitive Data

Tyler's Light does not collect personal health information or require
identification to access any resource. Never commit real personal data,
credentials, or API keys to this repository.
