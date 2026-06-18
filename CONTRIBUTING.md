# Contributing

Thank you for considering a contribution to Rubik's Cube Studio.

## Prerequisites

- Node.js `20.19.0` or newer (see `.nvmrc` for the pinned version)
- npm `10.8.2` or newer

If you use a Node Version Manager, run `nvm use` from the repository root.

## Getting started

```bash
git clone https://github.com/rahulpaul-07/rubiks-cube-studio.git
cd rubiks-cube-studio
nvm use
npm ci
npm run dev
```

## Development workflow

1. Create a feature branch from `main`.
2. Make your changes.
3. Run the full quality check before committing:

```bash
npm run check
```

This runs formatting verification, linting, type checking, unit tests, and a production build.

4. Commit using [Conventional Commits](https://www.conventionalcommits.org/) style:

```text
feat: add keyboard shortcuts for face rotation
fix: correct sticker placement on Back face
docs: update architecture diagram
test: add scramble edge-case coverage
chore: update eslint configuration
refactor: simplify solver initialization
ci: add node 22 to test matrix
```

5. Open a pull request against `main`.

## Code style

- **TypeScript** for all source files.
- **Prettier** for formatting (configured in `.prettierrc.json`).
- **ESLint** with `typescript-eslint` for linting.
- Run `npm run format` to auto-format before committing.

## Project structure

See [ARCHITECTURE.md](ARCHITECTURE.md) for a detailed breakdown of the module layout and dependency
flow.

## Tests

Tests are colocated with source files as `*.test.ts` and run with Vitest:

```bash
npm run test            # single run
npm run test:watch      # watch mode
npm run test:coverage   # coverage report
```

When adding new domain or application logic, include corresponding tests.

## Reporting issues

Open an issue on GitHub with:

- A clear description of the problem or feature request.
- Steps to reproduce (for bugs).
- Expected versus actual behavior.
