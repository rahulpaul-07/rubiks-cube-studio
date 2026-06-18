# Rubik's Cube Studio

A polished web version of a 3x3 Rubik's cube solver. It keeps the solving core real by using
`cubejs`, which implements Kociemba's two-phase algorithm, and adds a visual facelet editor,
Three.js cube preview, validation, scramble generation, and solution playback.

## Prerequisites

- Node.js `20.19.0` or newer supported release (`22.12.0+` for Node 22)
- npm `10.8.2` or newer

The repository pins Node.js `24.14.0` in `.nvmrc` and npm `11.9.0` in `package.json` for
reproducible local development. With a compatible Node Version Manager installed, run `nvm use` from
the repository root.

## Run

```bash
npm ci
npm run dev
```

## Build

```bash
npm run build
```

## Quality checks

Run formatting, linting, type checking, and the production build with one command:

```bash
npm run check
```

## Deploy on Render

This repo includes `render.yaml` for a Render Static Site.

- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`
