# Tyler's Light

[![CI](https://github.com/AEVentures/tylers-light/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/AEVentures/tylers-light/actions/workflows/ci.yml)
[![Deploy](https://github.com/AEVentures/tylers-light/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/AEVentures/tylers-light/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Faeventures.github.io%2Ftylers-light%2F&label=live%20site)](https://aeventures.github.io/tylers-light/)

**Open-source suicide-prevention infrastructure, dedicated to the memory of Tyler McNeil.**

> **In crisis right now?** Call or text **988** (US, 24/7), text **HOME** to
> **741741**, or call your local emergency number. See
> [docs/RESOURCES.md](docs/RESOURCES.md) for international lines. This
> repository is an educational resource, not a crisis service.

Tyler's Light is a public, open-source effort to build free
suicide-prevention resources, education, and tools — because prevention
information should never be locked behind a login, a paywall, or an
institution that's closed at 2 a.m.

## Why this exists

- Suicide is preventable, and prevention works when people get accurate
  information at the right moment.
- Existing resources are scattered across institutions and hard to find in
  a crisis.
- Most people who survive a suicide attempt do not go on to die by suicide
  later — the moment of crisis is not permanent, and help changes outcomes.

This project is dedicated to Tyler McNeil. See
[docs/DEDICATION.md](docs/DEDICATION.md) — his family and friends are
welcome to shape that page directly.

## What we are building

1. **A verified crisis-resource directory** — hotlines, text lines, and
   warmlines by country and language ([docs/RESOURCES.md](docs/RESOURCES.md)).
2. **Plain-language education** — warning signs and how to have a direct,
   caring conversation with someone who is struggling.
3. **Reusable, embeddable tools** — a free "Get Help" widget and structured
   data any school, employer, or community site can use.
4. **Safe messaging by default** — everything here follows WHO and AFSP
   guidance (see [docs/SAFE_MESSAGING.md](docs/SAFE_MESSAGING.md)).

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide](https://lucide.dev/) icons
- [Vitest](https://vitest.dev/) for testing

## Run locally

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
pnpm preview
```

## Test

```bash
pnpm test
```

## Documentation

- [Mission](docs/MISSION.md)
- [Dedication — Tyler McNeil](docs/DEDICATION.md)
- [Resources](docs/RESOURCES.md)
- [Safe Messaging Guidelines](docs/SAFE_MESSAGING.md)
- [Getting Started](docs/GETTING_STARTED.md)
- [Roadmap](docs/ROADMAP.md)

## Deploy

The live site is at https://aeventures.github.io/tylers-light/ and is hosted
on GitHub Pages. Pushes to `main` trigger `.github/workflows/deploy.yml`,
which builds and deploys automatically.

You can also run `pnpm build` and serve the `dist/` directory on any static
host.

## Contribute

See [CONTRIBUTING.md](./CONTRIBUTING.md). If your change touches user-facing
copy or crisis-line data, please also read
[docs/SAFE_MESSAGING.md](docs/SAFE_MESSAGING.md) first. We welcome
engineers, designers, translators, clinicians, educators, and advocates.

## License

[MIT](./LICENSE)
