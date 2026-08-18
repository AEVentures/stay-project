# Getting Started

## Prerequisites

- Node.js 20+
- pnpm 9+ (`corepack enable` will install it if you have Node 16.9+)

## Setup

```bash
git clone https://github.com/AEVentures/stay-project.git
cd stay-project
pnpm install
pnpm dev
```

The dev server prints a local URL (typically `http://localhost:5173`).

## Project structure

```
src/
  components/
    sections/   # Page sections (hero, in-memory, resources, etc.)
    ui/         # Small reusable UI primitives (Button, etc.)
  config/       # Site-wide config: links, crisis-line data
  lib/          # Utilities
docs/           # Mission, resources, safe-messaging guide, in-memory page
public/         # Static assets (favicon, robots.txt, sitemap.xml)
```

## Common tasks

| Task | Command |
| --- | --- |
| Start dev server | `pnpm dev` |
| Type-check + build | `pnpm build` |
| Preview production build | `pnpm preview` |
| Run tests | `pnpm test` |
| Watch tests | `pnpm test:watch` |

## Before you open a PR

1. Read [CONTRIBUTING.md](../CONTRIBUTING.md).
2. If your change touches user-facing copy, read
   [SAFE_MESSAGING.md](./SAFE_MESSAGING.md).
3. If your change touches crisis-line data, cite an official source in
   [RESOURCES.md](./RESOURCES.md).
4. Run `pnpm build` and `pnpm test` locally.
