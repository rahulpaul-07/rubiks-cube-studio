# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
