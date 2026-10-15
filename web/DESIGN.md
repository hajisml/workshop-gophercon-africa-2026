# Terra Scan — design

A sci-fi, holographic "technical biology" interface: a wildlife scanner's HUD. Dark space
background, glowing cyan lines, amber for highlights and field notes.

## Colours (`web/assets/css/app.css`, `:root`)

| Token | Hex | Use |
|-------|-----|-----|
| `--holo` | `#3DF5FF` | hologram cyan: links, numbers, glow, active chips |
| `--holo-dim` | `#8FD9E2` | secondary cyan text |
| `--space` | `#050B14` | page background, theme colour |
| `--panel-solid` / `--panel` | `#081A26` / translucent | cards and panels |
| `--line` | `#1B6F7A` | borders, grid lines |
| `--amber` | `#FFB347` | highlights: field notes, class badge, selected signal, focus ring |
| `--text` / `--muted` | `#D6F9FF` / `#8BB8C1` | body text / labels |

`--three-*` hold the globe's colours and must stay hex.

## Lettering

- Headings: Rajdhani 600–700, slightly condensed, uppercase for labels.
- Body: IBM Plex Sans.
- Readouts, labels, dates, coordinates: IBM Plex Mono, small, letter-spaced, uppercase.

## Shapes and spacing

- Panels and cards have a clipped top-right and bottom-left corner (`--cut`, 10–24px), 1px
  `--line` borders, and a soft cyan glow on hover.
- Radii are small (`--radius: 4px`). Spacing scales with `--gap`.
- A faint blueprint grid sits behind the page.

## Pages

| Page | URL | What's on it |
|------|-----|--------------|
| 01 Scan deck | `/` | globe + four counters, three module tiles, specimen archive (filters in a sticky side panel, 24 cards at a time with "Load more") |
| 02 Tracker | `/tracker?animal=…` | tracker globe + Target lock console |
| 03 Analysis lab | `/analysis` | four readings, signals per year, seasonality by month, top animals (link to tracker), regions, classes, recording method |
| 04 Observers | `/observers` | readings, top-20 leaderboard with bars, latest 14 transmissions |
| Specimen file | `/specimens/{id}` | photo with scan line and reticle + thumbnails, locator map, weather, field note, readout, lineage tree, observer credit, other signals of the animal |

Every page opens with `pageHead` (amber code, eyebrow, decoding h1, lede). Nav items carry their
module code and `aria-current` on the current page.

## Components

- **Header**: sticky; logo + "TERRA SCAN"; numbered nav; live UTC clock with a blinking green dot.
  Below it a status strip of lab telemetry scrolls slowly.
- **Globes** (three.js, sharing `scenes/hologlobe.js`): a scan band sweeps down each globe's panel.
  Home dots open specimen files; filters dim them.
- **Specimen card**: 4:3 photo with scan lines, tag, class badge; name, Latin name, place, observer
  and time. The whole card links to the specimen file.
- **Tracker**: amber arcing trail drawn oldest-first, play/scrub/step, current signal and stats.
- **Charts**: cyan bars and columns that grow in, a year line that draws left to right.

## Motion (`assets/js/lab.js`, `reveal.js`, `transitions.css`)

- Header slides in on load; sections and panels reveal with a flicker "power-on" and a scan line.
- `data-decode` headings resolve from random glyphs; `data-count` numbers count up.
- Pages cross-fade, the header staying put.
- Under reduced motion all of it is off and everything simply shows.

## Avoid

- Emoji as icons. Bright light backgrounds.
- Motion without a `prefers-reduced-motion` fallback.
