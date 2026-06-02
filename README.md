# create-pern-app

CLI scaffold for a TypeScript PERN starter with PostgreSQL, Express, React, Node.js, and Bun.

## Development

- `bun install`: install CLI dependencies
- `bun run dev`: run the CLI from source
- `bun run build`: build the CLI into `dist/`
- `bun test`: run the CLI unit tests

Use `--skip-install` while developing generator fixtures to avoid running dependency installation in generated projects.

## Publishing

Publishing runs through GitHub Actions in `.github/workflows/publish.yml`.

1. Create an npm automation token from your npm account.
2. Add it to the GitHub repository secrets as `NPM_TOKEN`.
3. Publish from the Actions tab with the `Publish to npm` workflow, or publish a GitHub release.

The workflow installs dependencies, runs tests, builds `dist/index.js`, checks package contents with `npm pack --dry-run`, then runs `npm publish --access public --provenance`.
