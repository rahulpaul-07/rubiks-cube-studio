# Rubik's Cube Studio

[![CI](https://github.com/rahulpaul-07/rubiks-cube-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/rahulpaul-07/rubiks-cube-studio/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen.svg)](https://rubiks-cube-studio.vercel.app)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Frahulpaul-07%2Frubiks-cube-studio)

An interactive 3×3 Rubik's Cube editor and solver built with TypeScript, Three.js, and the Kociemba
two-phase algorithm.

**[Try the live demo →](https://rubiks-cube-studio.vercel.app)**

![App Screenshot](./public/screenshot.png)

Users can paint or import a cube state, validate sticker counts and centers, generate a scramble,
apply move notation, solve the cube, and inspect the solution through step-by-step playback.

## Features

- Interactive 54-sticker cube editor with fixed centers
- Synchronized Three.js cube preview with pointer rotation
- Facelet-string import and export
- Standard move-notation input
- Random scramble generation
- Lazy-loaded Kociemba solver
- Solution timing, move count, copying, and playback controls
- Responsive desktop and mobile layouts
- Web App Manifest (PWA), SEO meta tags, and accessible focus states
- Render loop pauses automatically on backgrounded tabs to save battery and CPU

## Technology

- **TypeScript** for strict application and domain types
- **Vite** for local development and production builds
- **Three.js** for the interactive WebGL preview
- **cubejs** for cube transformations and Kociemba solving
- **ESLint and Prettier** for automated code-quality checks
- **Vitest** and **Playwright** for unit and end-to-end testing
- **GitHub Actions** for continuous integration

## Architecture

The codebase separates cube rules from browser-specific behavior:

```text
src/
├── app/        Application state and actions
├── domain/     Cube representation, parsing, notation, scrambles, and validation
├── rendering/  Three.js preview and sticker placement
├── solver/     Solver interface and cubejs adapter
├── styles/     Base, component, and design-token styles
├── ui/         DOM access and application template
└── main.ts     Application orchestration and event handling
```

Dependencies flow from the UI and rendering layers toward the application and domain layers. The
domain modules do not depend on the DOM, Three.js, or the solver implementation. See
[ARCHITECTURE.md](ARCHITECTURE.md) for the full dependency-flow diagram and design rationale.

## Testing & quality

Every change runs through the same checks locally and in CI:

- **54 unit tests** across 8 files (Vitest), covering domain logic, the state reducer, and the
  solver adapter, with no DOM dependency required for the pure `domain/` modules.
- **End-to-end tests** (Playwright) exercising the real browser flow: load, scramble, apply moves,
  and solve.
- **Strict TypeScript** (`tsc --noEmit`) and a zero-warning **ESLint** pass on every commit.
- **Prettier** formatting enforced via `format:check` and a Husky pre-commit hook.
- **GitHub Actions** runs the full `check` pipeline plus a dedicated end-to-end job on every push
  and pull request, each bounded by an explicit `timeout-minutes` so a hung test fails fast instead
  of silently consuming CI time.

Run everything locally with:

```bash
npm run check
```

## Prerequisites

- Node.js `20.19.0` or newer supported release (`22.12.0+` for Node 22)
- npm `10.8.2` or newer

The repository pins Node.js `24.14.0` in `.nvmrc` and npm `11.9.0` in `package.json`. With a
compatible Node Version Manager installed, run `nvm use` from the repository root.

## Local development

```bash
git clone https://github.com/rahulpaul-07/rubiks-cube-studio.git
cd rubiks-cube-studio
nvm use
npm ci
npm run dev
```

Vite serves the application at `http://127.0.0.1:5173` by default.

## Commands

| Command                 | Purpose                                                         |
| ----------------------- | --------------------------------------------------------------- |
| `npm run dev`           | Start the local development server                              |
| `npm run build`         | Type-check and create the production bundle                     |
| `npm run preview`       | Preview the production bundle locally                           |
| `npm run test`          | Run unit tests once                                             |
| `npm run test:watch`    | Run unit tests in watch mode                                    |
| `npm run test:coverage` | Run unit tests with coverage report                             |
| `npm run test:e2e`      | Run Playwright end-to-end tests                                 |
| `npm run test:e2e:ui`   | Run Playwright tests in interactive UI mode                     |
| `npm run format`        | Format supported project files                                  |
| `npm run format:check`  | Verify formatting without modifying files                       |
| `npm run lint`          | Run ESLint                                                      |
| `npm run typecheck`     | Run TypeScript without emitting files                           |
| `npm run check`         | Run formatting, linting, type checking, tests, and build checks |

## Cube representation

Cube states use the 54-character facelet format expected by `cubejs`, ordered as:

```text
UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB
```

The six face identifiers are `U`, `R`, `F`, `D`, `L`, and `B`. Each face must contain nine stickers,
and its center sticker is fixed.

Moves use standard notation such as `R U R' U'`. A suffix of `'` means counterclockwise and `2`
means a half turn.

## Current validation scope

The application currently validates:

- Total facelet count
- Supported face identifiers
- Nine stickers per color
- Fixed center positions
- Physical cubie-level uniqueness, parity, and orientation (via the `cubejs` solver engine)

## Deployment

`render.yaml` configures a Render Static Site:

- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- SPA fallback: all routes rewrite to `/index.html`

The live demo linked above is deployed on Vercel via the same production build.

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — module map, dependency flow, and design decisions
- [CONTRIBUTING.md](CONTRIBUTING.md) — development setup, workflow, and code style
- [CHANGELOG.md](CHANGELOG.md) — notable changes by release

## Known limitations

- Solver initialization and execution occur on the main browser thread, which can briefly block the
  UI while loading solver tables or solving a deeply scrambled cube. A Web Worker would remove this
  limitation.
- Solution playback updates cube states but does not animate individual face turns.
- Solver loading evaluates the CommonJS source distributed by `cubejs`, which limits strict Content
  Security Policy support (no `unsafe-eval`).

## License

[MIT](LICENSE)
