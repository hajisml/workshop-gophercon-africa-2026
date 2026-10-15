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

## Components

- **Header**: sticky, translucent; logo (reticle around a globe, amber dot) + "TERRA SCAN" wordmark.
- **Hero**: intro with four stat panels on the left, the 3D globe (three.js, `scenes/globe.js`) on
  the right. One glowing point per sighting; select one to scroll to its card. Filters dim points.
- **Wildlife tracker** (`#tracker`): a second globe (`scenes/tracker.js`) beside a "Target
  lock" console (`assets/js/tracker.js`). Pick an animal; its sightings are joined oldest-first by
  an amber arcing trail that draws itself as you play or scrub. The console shows the current
  signal (date, place, observer, link to its card) and stats: signals, regions, first/last seen,
  distance between signals. Both globes share `scenes/hologlobe.js`.
- **Activity dashboard** (`#activity`): signals-per-year line since 2010 with the busiest year and
  last-12-months figures, and cyan bars for top animals, regions and classes (charts block).
  Animal bars are buttons that lock the tracker on to that animal.
- **Filter**: chips for class, animal and region, plus search (filter block).
- **Specimen card**: 4:3 photo with scan lines and a hover sweep, catalogue tag, class badge;
  name, Latin name, taxonomy; a dashed readout (location, coords, count); an amber field note
  (fun fact from `components/facts.go`); observer credit with the time logged.
- **Observer credits**: top-10 observers leaderboard and the latest transmissions.

## Avoid

- Emoji as icons. Bright light backgrounds.
- Motion without a `prefers-reduced-motion` fallback.
