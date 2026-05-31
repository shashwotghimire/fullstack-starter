# Repository Guidelines

## Project Structure & Module Organization

This repository is currently a clean starter workspace. As code is added, keep the layout predictable:

- `frontend/` for client applications, UI components, routes, and browser assets.
- `backend/` for API services, server code, data access, and background jobs.
- `shared/` for types, validation schemas, utilities, or constants used by both sides.
- `tests/` for cross-cutting integration or end-to-end tests.
- `docs/` for architecture notes, setup guides, and runbooks.

Keep files close to the feature they support. Prefer `feature-name/` directories with implementation, tests, and local helpers over large global utility folders.

## Build, Test, and Development Commands

No package manager or build scripts are committed yet. When adding tooling, document commands in `README.md` and keep names stable:

- `npm install` or `pnpm install`: install dependencies.
- `npm run dev`: start the local development stack.
- `npm run build`: produce production-ready artifacts.
- `npm test`: run the full test suite.
- `npm run lint`: run static analysis and formatting checks.

For multiple apps, add workspace examples such as `npm run dev --workspace frontend`.

## Coding Style & Naming Conventions

Use two-space indentation for JavaScript, TypeScript, JSON, YAML, and Markdown. Prefer TypeScript when a Node or browser stack is added. Use `camelCase` for variables and functions, `PascalCase` for classes and React components, and `kebab-case` for directories and route-like files.

Add automated formatting early, preferably Prettier plus ESLint for JS/TS projects. Keep generated files, build output, and dependencies out of version control.

## Testing Guidelines

Place unit tests next to the code they cover using names like `user-service.test.ts` or `Button.test.tsx`. Put integration and end-to-end tests under `tests/` when they span modules. New behavior should include tests for the expected path and one edge case.

Until a test framework is chosen, include manual verification steps in PRs.

## Commit & Pull Request Guidelines

This directory has no Git history yet, so no existing convention can be inferred. Use short imperative messages, for example `Add auth route scaffold` or `Fix signup validation`.

Pull requests should include a summary, test results, linked issues when applicable, and screenshots or recordings for UI changes. Keep PRs focused and call out configuration, migration, or deployment impact.

## Security & Configuration Tips

Do not commit secrets, credentials, or environment-specific files. Use `.env.example` to document required variables and keep real values in local `.env` files or the deployment secret store.
