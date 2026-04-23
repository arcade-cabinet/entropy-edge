---
title: Entropy Edge
updated: 2026-04-23
status: current
---

# Entropy Edge

> Ride the edge of reserve depletion through hazard sectors, each
> modifier rewriting the calculus, finish with a reserve strategy
> that held.

A reserve-economy sector roguelite. You pilot a resonance sphere
across a grid-aligned sector looking for magenta anchors, while
hazard blocks fall from above and a cyan-beacon time reserve ticks
down. Secure the anchor route, build resonance, clear blocked cells
with surges, and graduate to the next sector — every modifier
rewrites the calculus.

Built with React 19 + Vite 8 + @react-three/fiber + @react-three/drei
+ Koota ECS + Three.js. Capacitor wraps it as a debug APK for
Android; the web build deploys to GitHub Pages at `/entropy-edge/`.

## Quick start

```bash
pnpm install
pnpm dev          # Vite dev server — http://localhost:5183
pnpm test         # node-mode unit tests (simulation)
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
