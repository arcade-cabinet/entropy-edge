---
title: Standards
updated: 2026-04-23
status: current
domain: quality
---

# Entropy Edge — Standards

## Code quality

### File length

Soft limit 300 LOC per file. Hard exceptions:

- `src/engine/simulation.ts` — deterministic sim. ~600 LOC because
  it holds the sector seed tables, modifier matrix, and the full
  tick/route logic. Acceptable up to 1000; split by subsystem past
  that.
- `src/ui/game/EdgeScene.tsx` — R3F scene. ~635 LOC because it
  defines the grid, player sphere, anchor mesh, hazard blocks,
  shockwaves, route lines, and camera all in one file. Acceptable
  up to 900; split into per-primitive subcomponents past that.
- `src/ui/Game.tsx` — orchestrator. ~300 LOC acceptable.

### TypeScript

- Strict mode via `tsconfig.app.json`.
- `verbatimModuleSyntax: true` — use `import type` for type-only
  imports.
- No `any`. Prefer discriminated unions.
- Explicit return types on exported functions.

### Linting and formatting

- Biome 2.4. `pnpm lint` = `biome lint .`.
- No ESLint, no Prettier, no stylelint.
- No Tailwind build. `src/theme/tw.css` holds the pinned utility
  subset for any carry-over className usage.

### Dependencies

- Weekly dependabot, minor + patch grouped.
- three/@react-three/* pinned by major; review before bumping.
- koota pinned by major; review before bumping.
- react / react-dom share version, bump together.

## Player-journey gate (non-negotiable)

A PR may not merge if any of the below fail on desktop (1280×800) OR
mobile-portrait (390×844) viewports.

1. Cold load: first-render paints in under 2 seconds from navigation.
2. Start screen shows "Entropy's Edge" in Space Grotesk orange, the
   tagline, three verb chips (Secure anchors / Build resonance /
   Hold the edge), and the "Initialize Link" CTA. No layout shift.
3. Clicking "Initialize Link" transitions to gameplay within 600ms,
   no console errors, R3F scene paints.
4. Within 15 seconds of gameplay a cold player can identify: their
   player sphere (cyan glow, centered), at least one magenta anchor,
   blocked hazard cells, falling blocks above, and the HUD showing
   Sector, Anchors, Score, Stability, Resonance.
5. Touch-joystick anywhere in the viewport moves the sphere.
6. No console errors throughout the run.
7. Win finale reads "strategy that held" with a rating; loss finale
   reads "Sector Collapsed" and offers restart. Neither screams.

## Brand

- Title: "Entropy's Edge"
- Tagline: "Ride the edge of reserve depletion through hazard
  sectors, each modifier rewriting the calculus, finish with a
  reserve strategy that held."
- Palette and fonts: see [`CLAUDE.md`](./CLAUDE.md) palette block.
- Icon: a single cyan-beacon anchor silhouette over graphite.
  TODO (tracked in `docs/STATE.md`).
