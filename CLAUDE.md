---
title: Claude Code Instructions
updated: 2026-04-23
status: current
---

# Entropy Edge — Agent Instructions

## What This Is

A reserve-economy sector roguelite. The player moves a resonance sphere
across an 11×11 grid looking for magenta anchors. Blocked cells carve
obstacles, falling blocks add pressure, and a cyan-beacon stability
reserve ticks down. Securing anchors builds resonance, which powers
surge-clears that reset blocked cells. Three sectors per run; each
sector mutates the modifier set so the calculus never repeats.

The game is about **routing under time pressure**, not dexterity.
Every frame the player is choosing which anchor to go for and how to
preserve reserve. A finish is not a high score — it's a *reserve
strategy that held*.

## Critical Rules

1. **Engine is deterministic.** `src/engine/simulation.ts` is pure
   TypeScript and must stay testable without the DOM or WebGL.
2. **R3F owns the scene.** `src/ui/game/EdgeScene.tsx` renders the
   3D grid, anchors, hazard blocks, route lines, and player sphere.
   HUD is DOM.
3. **Koota is the ECS.** `entropyEntity` carries `PhaseTrait`,
   `ScoreTrait`, `TimerTrait`, `EntropyTrait`. The React layer reads
   via `useTrait`, writes via `entity.set(...)`.
4. **CSP allows unsafe-eval.** Three.js compiles shaders at runtime,
   so the CSP meta in `index.html` must include `'unsafe-eval'` and
   `'wasm-unsafe-eval'` in `script-src`. Without these R3F fails to
   initialise on page load.
5. **No Tailwind build.** `src/theme/tw.css` is the pinned utility
   subset. Identity lives in `src/theme/global.css` + inline styles.
6. **Biome, not ESLint.** `pnpm lint` runs Biome.
7. **pnpm only.** Do not create `package-lock.json` or `yarn.lock`.
8. **Finale is "strategy that held", not GAME OVER.** Completion
   writes the rating + reserve carried; defeat phrasing is "sector
   collapsed" — both with continue paths.

## Commands

```bash
pnpm dev                 # Vite dev server
pnpm build               # tsc + vite build
pnpm typecheck           # tsc -b --pretty false
pnpm lint                # Biome
pnpm test                # test:node + test:dom
pnpm test:browser        # real Chromium via @vitest/browser-playwright
pnpm test:e2e            # Playwright end-to-end
pnpm cap:sync            # build + cap sync (android)
pnpm cap:open:android    # open Android Studio
pnpm cap:run:android     # pnpm cap:sync && cap run android
```

## Project Structure

- `src/engine/simulation.ts` — deterministic sim: grid, anchors,
  falling blocks, resonance, sector transitions, completion cues.
- `src/engine/types.ts` — `EntropyState`, `Vec2`, `FallingBlock`,
  `GridNode`, `Shockwave`.
- `src/store/` — Koota world + traits. `shared-traits.ts` holds the
  cabinet-heritage `PhaseTrait`/`ScoreTrait`/`TimerTrait`.
- `src/lib/` — `sessionMode`, `runtimePause`, `testing`, `types`,
  `utils`.
- `src/hooks/` — `useContainerSize`, `useGameLoop`,
  `useRunSnapshotAutosave`, `runtimeResult`, `useResponsive`.
- `src/theme/` — palette tokens, global CSS, tw.css.
- `src/ui/Game.tsx` — orchestrator. Owns phase (menu / playing /
  win / gameover), movement input, save persistence.
- `src/ui/game/EdgeScene.tsx` — R3F scene.
- `src/ui/game/HUD.tsx` — HUD overlay.
- `src/ui/shell/` — identity chrome (`GameViewport`, `StartScreen`,
  `GameOverScreen`, `OverlayButton`, `FloatingJoystick`).

## Design palette (locked-in)

See [`docs/DESIGN.md`](docs/DESIGN.md) for rationale.

```
--color-bg:        #07080a   void graphite (background)
--color-graphite:  #0f1115   grid surface
--color-surface:   #1a1d24   HUD surfaces
--color-signal:    #ff6b1a   signal orange (title, CTA, resonance)
--color-beacon:    #21d4ff   cyan beacon (anchors, joystick)
--color-fg:        #dce1e8   chrome white
--color-fg-muted:  #7a8190   muted chrome
--color-warn:      #ff375f   hazard red (collapse, danger)
```

Display font: Space Grotesk (geometric uppercase, condensed weight).
Body font: Inter (HUD + body).
Mono font: JetBrains Mono (reserve readouts, gauge numerics).
