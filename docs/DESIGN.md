---
title: Design
updated: 2026-04-23
status: current
domain: product
---

# Design

## Identity

*Entropy Edge* is a **reserve-economy roguelite**. The player plays
a resonance sphere navigating an 11×11 sector grid, threading a route
between magenta anchors under a ticking stability reserve. Blocked
cells and falling hazard blocks constantly rewrite the route. The
point is not to clear the sector quickly; it is to *keep the reserve
alive long enough to secure all the anchors*.

Each run is three sectors. Each sector ships a different modifier
package — more hazards, faster decay, fewer anchors, surge windows.
Finishing a run is not a high-score celebration; it's a rating of
how your reserve strategy held under the specific calculus of this
seed.

## Player journey

1. **Land.** The title card reads "Entropy's Edge" in Space Grotesk
   signal-orange on graphite. Subtitle: *"Ride the edge of reserve
   depletion through hazard sectors, each modifier rewriting the
   calculus, finish with a reserve strategy that held."* Three verb
   chips — *Secure anchors · Build resonance · Hold the edge.* One
   primary CTA: "Initialize Link."
2. **Orient.** The R3F scene fades in: the cyan-beacon-walled grid,
   the player sphere in the center, three magenta anchors scattered,
   red-capped hazard blocks already falling. HUD on left shows
   Sector 1/3, Anchors 0/3, Score, Stability reserve, Resonance %,
   Route cue.
3. **Route.** The player steers with keyboard arrows or a
   touch-anywhere joystick. Secure an anchor → magenta pulse → +score,
   anchor count ticks up, resonance % rises. Resonance ≥ 100 →
   surge clears blocked cells.
4. **Hold.** Stability reserve ticks down regardless of movement.
   Falling blocks bounce and occasionally become blocked cells.
   Standing still burns reserve too — there is no safe pause.
5. **Edge.** Finishing all anchors in the sector advances. Three
   sectors later the grove is "stabilized"; the rating screen shows
   the reserve carried forward and the seed that held. If reserve
   hits zero the sector collapses and the run ends at whichever
   sector broke.

## Palette rationale

- `#07080a` void graphite — the background. Near-black with a
  slight blue cast so the signal channel reads.
- `#0f1115` grid graphite — the playfield; flat but not black so
  the route lines cast subtle shadow.
- `#1a1d24` HUD surface — one step up; used for label chrome so
  the chrome reads as the same metal.
- `#ff6b1a` signal orange — the hero channel. Title, CTA, resonance
  fill, rating. Any orange on screen is the player's eye-path.
- `#21d4ff` cyan beacon — anchors, route cues, joystick knob. The
  only color that reads as "good thing to approach."
- `#dce1e8` chrome white — body text and readouts. Not pure white;
  sits comfortably on graphite without glare.
- `#7a8190` muted chrome — secondary labels.
- `#ff375f` hazard red — blocked cells, falling hazards, collapse.
  Warm red deliberately breaks the orange-cyan split so the player
  reads it as an intrusion.

## Fontography rationale

**Space Grotesk** (display, uppercase): a geometric condensed
sans-serif with subtle humanist warmth in its bowls. Fits the
"chrome-industrial roguelite" tone better than anything Eurostile-
adjacent. Used for the title and any uppercase-stat header.

**Inter** (body + HUD): high x-height, tabular figures, legible at
12px against graphite. Stat readouts and buttons.

**JetBrains Mono** (readouts): for the reserve value, resonance
percent, sector cue — numeric data that benefits from mono grid.

All three fall back to system equivalents.

## Future work

- Two additional sector modifiers (time-dilation well, chain-lock
  anchors).
- Seeded daily sectors.
- Post-run stability-carry visualization — show the trace of
  reserve over time.
- Portrait-locked capacitor config for phone play.
- Ambient audio: subtle ticking, surge chime, hazard click.
