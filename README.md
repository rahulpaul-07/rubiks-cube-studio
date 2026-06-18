# Rubik's Cube Studio

An interactive 3×3 Rubik's Cube editor and solver built with TypeScript, Three.js, and the Kociemba
two-phase algorithm.

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

## Technology

- **TypeScript** for strict application and domain types
- **Vite** for local development and production builds
- **Three.js** for the interactive WebGL preview
- **cubejs** for cube transformations and Kociemba solving
- **ESLint and Prettier** for automated code-quality checks

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
domain modules do not depend on the DOM, Three.js, or the solver implementation.

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

| Command                | Purpose                                                  |
| ---------------------- | -------------------------------------------------------- |
| `npm run dev`          | Start the local development server                       |
| `npm run build`        | Type-check and create the production bundle              |
| `npm run preview`      | Preview the production bundle locally                    |
| `npm run format`       | Format supported project files                           |
| `npm run format:check` | Verify formatting without modifying files                |
| `npm run lint`         | Run ESLint                                               |
| `npm run typecheck`    | Run TypeScript without emitting files                    |
| `npm run check`        | Run formatting, linting, type checking, and build checks |

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

Full physical-state validation—including cubie uniqueness, orientation, and permutation parity—is
planned. Until implemented, a color-balanced state can still be physically impossible.

## Deployment

`render.yaml` configures a Render Static Site:

- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- SPA fallback: all routes rewrite to `/index.html`

## Known limitations

- Solver initialization and execution occur on the main browser thread.
- Solution playback updates cube states but does not animate individual face turns.
- The Three.js preview currently renders continuously while the page is open.
- Automated unit, integration, and end-to-end tests are not yet configured.
- Solver loading evaluates the CommonJS source distributed by `cubejs`, which limits strict Content
  Security Policy support.
