# Architecture

This document describes the high-level design of Rubik's Cube Studio. It is intended for
contributors and reviewers who want to understand how the application is structured before reading
the source.

## Overview

Rubik's Cube Studio is a client-side single-page application that lets users paint, scramble,
validate, scan, and solve a 3×3 Rubik's Cube. Solving uses a from-scratch implementation of Herbert
Kociemba's two-phase algorithm that runs in a Web Worker; `cubejs` is used only as a test oracle. A
Three.js-powered 3D preview renders and animates the cube in real time.

The application is bundled with Vite and written entirely in TypeScript.

## Module map

```text
index.html
└── src/
    ├── main.ts              Application orchestration
    │
    ├── app/                 Application state
    │   ├── actions.ts       Action type definitions
    │   └── state.ts         State shape and reducer
    │
    ├── domain/              Pure cube logic (no DOM, no Three.js)
    │   ├── cube.ts          Face constants and solved state
    │   ├── colorDetection.ts  HSV sticker-color classification (webcam scan)
    │   ├── facelets.ts      Facelet parsing and serialization
    │   ├── notation.ts      Move notation parsing
    │   ├── scramble.ts      Random scramble generation
    │   └── validation.ts    Sticker count and center validation
    │
    ├── scan/                Webcam scanning
    │   └── CubeScanner.ts   getUserMedia capture, sampling, and modal UI
    │
    ├── rendering/           Three.js visualization
    │   ├── CubePreview.ts   Scene, camera, renderer, animated face turns
    │   ├── moveRotation.ts  Move → 3D layer-rotation mapping (verified)
    │   └── stickerPlacement.ts  3D position and rotation for each sticker
    │
    ├── solver/              Solving
    │   ├── types.ts         Solver service interfaces
    │   ├── cubejsSolver.ts  cubejs adapter (test oracle)
    │   ├── twoPhaseSolver.ts  Web Worker client (async solver service)
    │   ├── twophase.worker.ts  Worker entry: builds tables, answers solves
    │   ├── benchmark.ts     Standalone solver benchmark
    │   └── twophase/        From-scratch Kociemba two-phase solver
    │       ├── cube.ts      Cubie model, moves, facelet conversion
    │       ├── coords.ts    Phase-1/phase-2 coordinates
    │       ├── tables.ts    Move tables and pruning tables
    │       └── search.ts    IDA* two-phase search
    │
    ├── styles/              CSS layers
    │   ├── tokens.css       Design tokens and font stack
    │   ├── base.css         Reset and element defaults
    │   ├── components.css   Component styles
    │   └── index.css        Import entry point
    │
    ├── types/               Ambient type declarations
    │   └── cubejs.d.ts      Type definitions for the cubejs package
    │
    └── ui/                  DOM layer
        ├── dom.ts           Element queries
        └── template.ts      HTML template rendering
```

## Dependency flow

```text
  ┌──────────┐    ┌───────────┐    ┌──────────────┐
  │   UI     │───▶│ Application│───▶│   Domain     │
  │ (dom,    │    │ (state,   │    │ (cube,       │
  │  template)│    │  actions) │    │  facelets,   │
  └──────────┘    └───────────┘    │  notation,   │
                                    │  scramble,   │
  ┌──────────┐                      │  validation) │
  │ Rendering│─────────────────────▶└──────────────┘
  │ (Three.js)│
  └──────────┘

  ┌──────────┐
  │  Solver  │  (independent; called from main.ts)
  └──────────┘
```

Domain modules are pure and have no dependencies on the DOM, Three.js, or the solver implementation.
The UI and rendering layers depend on domain types but never on each other.

`main.ts` acts as the composition root, wiring event handlers to state transitions and rendering
updates.

## Key design decisions

### State management

The application uses a reducer-style pattern (`reduceAppState`) to manage state transitions. All
mutations flow through a single function, making state changes predictable and testable.

### Solver loading

`cubejs` distributes its solver tables as CommonJS source. The `CubeJsSolver` adapter evaluates this
source lazily. To avoid blocking the initial page load while ensuring the solver is ready quickly,
it is initialized during the browser's idle time using `requestIdleCallback`.

### Three.js lifecycle

`CubePreview` manages its own animation loop and pointer-based rotation. The class exposes
`update()` to synchronize sticker colors and `dispose()` to clean up WebGL resources when the page
unloads.

### Validation scope

The application validates facelet count, color balance, and center positions natively. It then
relies on the `cubejs` engine to perform full cubie-level validation (edge/corner permutation parity
and orientation) to catch physically impossible states.

## Testing

Unit tests cover the `domain/` and `app/` modules using Vitest. Tests are colocated next to source
files as `*.test.ts`. Run them with:

```bash
npm run test            # single run
npm run test:watch      # watch mode
npm run test:coverage   # coverage report
```

## Build and deployment

Vite produces a static bundle in `dist/`. The `render.yaml` file configures a Render Static Site
deployment. Any static hosting service can serve the output of `npm run build`.
