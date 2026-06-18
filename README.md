# Rubik's Cube Studio

A polished web version of a 3x3 Rubik's cube solver. It keeps the solving core real by using `cubejs`, which implements Kociemba's two-phase algorithm, and adds a visual facelet editor, Three.js cube preview, validation, scramble generation, and solution playback.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy on Render

This repo includes `render.yaml` for a Render Static Site.

- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`
