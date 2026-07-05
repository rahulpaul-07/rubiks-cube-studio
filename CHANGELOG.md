# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Fixed an infinite loop in `createScramble()` that occurred whenever the injected random number
  generator produced the same value repeatedly (e.g. a fixed/stubbed RNG). The previous
  implementation rejection-sampled from `FACES` until a non-repeating face turned up, with no bound
  on retries; it now samples directly from a pre-filtered candidate list, guaranteeing termination
  in exactly `length` iterations regardless of the RNG. This bug was silently hanging CI runs for up
  to GitHub Actions' 6-hour job timeout.
- Fixed a Prettier formatting violation in `.github/ISSUE_TEMPLATE/feature_request.yml` that was
  failing the `format:check` step of the CI `quality` job on every run.

### Changed

- `CubePreview` now pauses its Three.js animation loop when the tab is hidden (`visibilitychange`)
  instead of rendering continuously, reducing idle CPU/GPU and battery use.
- Added `timeout-minutes` to both CI jobs so a future hang fails fast instead of consuming the full
  default GitHub Actions job timeout.

## [1.0.0] - 2026-06-19

### Added

- Interactive 3x3 Rubik's Cube editor with standard facelet format
- Three.js WebGL rendering for synchronized 3D preview
- Full Kociemba two-phase algorithm solver integration
- Physical cubie-level validation (parity, orientation) natively via solver engine
- State input/output using standard 54-character string notation
- Move notation support for standard moves, rotations, and slices
- Scramble generator guaranteeing no redundant consecutive moves
- Playback controls for generated solutions
- PWA manifest and theme colors for installability
- Strict type checking and automated testing with Vitest and Playwright
- GitHub Actions CI/CD workflows and automated Dependabot updates
- Improved accessibility with skip links, \`aria-live\` regions, and keyboard shortcuts
- Split vendor chunks in production build to optimize caching
- Added standard repository templates (\`ISSUE_TEMPLATE\`, \`PULL_REQUEST_TEMPLATE\`)
- Configured \`no-console\` ESLint rules for cleaner production builds
