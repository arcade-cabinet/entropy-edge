---
title: Entropy Edge
updated: 2026-04-23
status: current
---

# Entropy Edge

> Two builders, one lattice. Race the same objective, brace what you
> build, and keep what was load-bearing when you claimed it.

A structural-duel roguelite. You and a Yuka-driven rival build
upward from the same ground plane, racing to satisfy the sector goal
— *reach a tier target while holding connectivity thresholds at
intermediate tiers* — under a stability solver that drops towers
that can't carry themselves. Shapes compose as you place: four cells
in a square with one centered on top becomes a wedge; a 2×2 on top
of a 3×3 with a cap becomes a pyramid; a block hanging off a column
becomes a cantilever if it's braced and falls as rubble if not.

Whoever claims the sector keeps the cells that were load-bearing at
claim-time as permanent monuments. A run is one cumulative
skyscraper built across a seed.

Built with React 19 + Vite 8 + `@jolly-pixel/voxel.renderer` +
`@jolly-pixel/engine` + Three.js + `@dimforge/rapier3d-compat` +
Yuka + Tone.js + Zod. Capacitor wraps it as a debug APK for
Android; the web build deploys to GitHub Pages at `/entropy-edge/`.

## Quick start

```bash
pnpm install
pnpm dev          # Vite dev server
pnpm test         # node-mode unit tests (sim layer)
pnpm test:dom     # jsdom tests for presentational shells
pnpm test:browser # real-Chromium WebGL tests
pnpm test:e2e     # Playwright end-to-end
pnpm build        # production bundle → dist/
pnpm preview      # serve dist/ locally
pnpm cap:sync     # copy dist/ into android/
```

## Documentation

| File                                         | Domain         |
| -------------------------------------------- | -------------- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | technical      |
| [docs/DESIGN.md](docs/DESIGN.md)             | product        |
| [docs/PRODUCTION.md](docs/PRODUCTION.md)     | context        |
| [docs/TESTING.md](docs/TESTING.md)           | quality        |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)     | ops            |
| [docs/STATE.md](docs/STATE.md)               | context        |
| [docs/RELEASE.md](docs/RELEASE.md)           | ops            |
| [AGENTS.md](AGENTS.md)                       | agent entry    |
| [CLAUDE.md](CLAUDE.md)                       | Claude entry   |
| [STANDARDS.md](STANDARDS.md)                 | quality        |
| [CHANGELOG.md](CHANGELOG.md)                 | release-please |

## License

MIT. See [LICENSE](LICENSE).
