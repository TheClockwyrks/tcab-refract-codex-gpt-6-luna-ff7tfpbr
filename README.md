# Refract

Refract is a browser puzzle about drawing beams of light across a dark optical bench. Trace each channel between its two emitters, pass through every lens, and spend every crystal charge without reusing a segment or crossing another beam.

## Install and run

```sh
npm ci
npm run dev
```

Vite prints the local development URL. To make a static production site:

```sh
npm run build
```

The complete site is written to `dist/`; serve that directory from the root of any static host.

## Controls

- Click, tap, or press on an emitter or an existing beam end, then drag from node to node.
- Backtrack along the beam to retract. Release to leave a partial route in place.
- Arrow keys or WASD move menu highlights; Enter or Space confirms; Escape goes back.
- Press **R** to clear a board and **M** to mute or unmute.

Campaign offers 24 hand-designed boards. Cascade creates a continuing sequence that grows through five difficulty tiers. The HOW TO PLAY screen explains the beam rules in game.
