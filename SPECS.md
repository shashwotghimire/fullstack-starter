# SPECS.md — `create-pern-app` CLI Tool

## Project Overview

A command-line tool (npm package) that scaffolds a full-stack **PERN** (PostgreSQL, Express, React, Node.js) starter project with **TypeScript** throughout. Built using **Bun**. Inspired by `create-t3-app` in philosophy: opinionated defaults, interactive prompts, minimal boilerplate.

**Invocation:**
```bash
npx create-pern-app
# or
bunx create-pern-app
# or with a project name
npx create-pern-app my-app
```

---

## Tech Stack

### CLI Tool Itself
- **Runtime/Bundler:** Bun
- **Language:** TypeScript
- **Prompt library:** `@clack/prompts` (clean, modern CLI prompts)
- **Scaffolding strategy:** Hybrid static templates plus generator functions, written with Bun file APIs (no `ejs` or `handlebars`)
- **Future package target:** npm as `create-pern-app` (publishing is out of scope for MVP)

### Generated Project Stack
| Layer | Technology |
|---|---|
| Database | PostgreSQL |
| Backend | Node.js + Express |
| Frontend | React (Vite) |
| Language | TypeScript (strict mode, both client & server) |
| ORM | User's choice (see below) |
| Package manager | Bun (generated project also uses Bun) |

---

## CLI Interactive Prompts

When the user runs `npx create-pern-app`, they are walked through these prompts in order:

1. **Project name** *(if not passed as CLI arg)*
   - Input field
   - Validated: lowercase, no spaces, URL-safe (kebab-case)
   - Default: `my-pern-app`

2. **ORM selection** *(single select)*
   - `Prisma` — schema-first, great DX, auto-migrations
   - `Drizzle ORM` — lightweight, SQL-like, type-safe

3. **Authentication** *(single select)*
   - `None` — skip auth setup
   - `JWT` — stateless JWT auth with simple bearer access tokens
   - `Session` — express-session + connect-pg-simple

4. **Docker Compose** *(confirm yes/no, default yes)*
   - If yes: generate a `docker-compose.yml` with a Postgres service for local dev

5. **Database setup now** *(conditional)*
   - If Docker Compose is selected: ask whether to start Postgres with Docker and run the initial migration now
   - If Docker Compose is not selected: ask for a PostgreSQL connection string if the user wants the CLI to run the initial migration now
   - If neither Docker Compose nor a connection string is provided: skip DB execution and print migration commands as next steps
   - Default: skip DB execution

6. **ESLint + Prettier** *(confirm yes/no)*
   - Generates shared config for both client and server

7. **Git init** *(confirm yes/no)*
   - Runs `git init` and creates an initial commit only after file generation and dependency installation succeed

---

## Generated Project Structure

```text
my-pern-app/
├── client/                      # React + Vite frontend (port 5173)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx       # Simple starter/landing page
│   │   │   └── HealthPage.tsx     # API health status page
│   │   ├── hooks/
│   │   │   └── useHealthCheck.ts  # TanStack Query hook for /api/health
│   │   ├── lib/
│   │   │   ├── axios.ts           # Configured axios instance
│   │   │   ├── auth.ts            # Token storage helpers when JWT is selected
│   │   │   └── queryClient.ts     # TanStack QueryClient singleton
│   │   ├── utils/
│   │   │   └── queryKeys.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── .env                      # Generated local client env, gitignored
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── server/                      # Express backend (port 8080)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── index.ts           # Route aggregator — mounts all sub-routers
│   │   │   └── health.ts          # GET /api/health
│   │   ├── controllers/
│   │   │   └── healthController.ts
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts
│   │   │   └── notFound.ts
│   │   ├── db/
│   │   │   └── index.ts           # DB client init (ORM-specific)
│   │   ├── constants/
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── env.ts
│   │   │   └── response.ts
│   │   ├── app.ts                 # Express initialization, middleware, routes
│   │   └── server.ts              # DB connection and app.listen startup
│   ├── .env                       # Generated local server env when needed, gitignored
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
│
├── [ORM config files]           # prisma/schema.prisma OR drizzle.config.ts
├── docker-compose.yml           # (if selected)
├── .gitignore
├── .prettierrc                  # (if selected)
└── README.md
```

> The project uses a simple two-package layout with `client/` and `server/` as separate packages. There is no root `package.json` in the MVP. Users run commands by `cd`ing into `client/` or `server/`. Root-level convenience scripts can be added later.

---

## ORM-Specific Scaffolding

> **MVP scope: Prisma and Drizzle only.**

### Shared: User Table Schema

Both ORMs must scaffold an initial `users` table with the following fields. The CLI writes the schema first, then can run the ORM's migration flow only when DB setup is explicitly selected and a reachable Postgres database is available.

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | Primary key, default `gen_random_uuid()` |
| `email` | VARCHAR(255) | Unique, not null |
| `name` | VARCHAR(255) | Not null |
| `password_hash` | TEXT | Not null |
| `created_at` | TIMESTAMP | Not null, default `now()` |
| `updated_at` | TIMESTAMP | Not null, default `now()` |

### Prisma
- `prisma/schema.prisma` with the `User` model matching the schema above
- `prisma/migrations/` — initial migration generated/applied via `prisma migrate dev --name init` only when DB setup is selected
- `server/src/db/index.ts` exports a `PrismaClient` singleton (one instance, not re-instantiated per request)
- Scripts: `db:generate`, `db:migrate`, `db:migrate:prod`, `db:studio`
- `server/.env` includes `DATABASE_URL`

### Drizzle ORM
- `drizzle.config.ts` at root pointing to `server/src/db/schema.ts`
- `server/src/db/schema.ts` — `users` table defined with `pgTable` matching the schema above, including `pgEnum` or `uuid` helpers as needed
- `server/src/db/index.ts` exports a `drizzle(pool)` instance using the `postgres` driver
- `server/src/db/migrations/` — initial migration generated/applied via `drizzle-kit generate` and `drizzle-kit migrate` only when DB setup is selected
- Scripts: `db:generate`, `db:migrate`
- `server/.env` includes `DATABASE_URL`

---

## Auth-Specific Scaffolding

### JWT
- `server/src/middleware/auth.ts` — `verifyToken` middleware
- `server/src/routes/auth.ts` — `/register` and `/login` endpoints only
- `server/src/controllers/authController.ts`
- `server/src/services/authService.ts` contains user lookup/creation and password verification
- `server/src/validators/authValidator.ts` uses Zod for request validation
- Packages: `jsonwebtoken`, `bcryptjs`, `zod`, `@types/jsonwebtoken`, `@types/bcryptjs`
- `server/.env` includes `JWT_SECRET` and `JWT_EXPIRES_IN`
- Frontend: `client/src/lib/auth.ts` stores the bearer token in `localStorage`
- `client/src/lib/axios.ts` attaches the bearer token from `localStorage` when present
- No refresh tokens and no email verification in MVP

### Session
- `server/src/middleware/session.ts` — `express-session` setup
- `connect-pg-simple` for session persistence in Postgres
- Packages: `express-session`, `connect-pg-simple`
- `server/.env` includes `SESSION_SECRET`

---

## Environment Variables

Environment files are generated inside the app package that reads them. Root `.gitignore` must ignore `**/.env`.

`server/.env.example` is always generated. Contents vary by choices but always include:

```env
# Server
PORT=8080
NODE_ENV=development

# Database (format depends on ORM choice)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/my_pern_app

# Auth (if selected)
JWT_SECRET=changeme
JWT_EXPIRES_IN=15m

SESSION_SECRET=changeme
```

`client/.env.example` is always generated:
```env
VITE_API_URL=http://localhost:8080
```

The CLI also creates gitignored runtime `.env` files when needed:

- `server/.env` is generated when Docker Compose is selected, when the user provides a DB connection string, or when auth is selected.
- `client/.env` is generated with `VITE_API_URL=http://localhost:8080`.
- If the user provides a DB connection string, write it to `server/.env`, never to `server/.env.example`.
- If auth is selected, generate random local secrets in `server/.env`; keep placeholders in `server/.env.example`.

---

## Package Scripts

There is no root `package.json` in the MVP. Users run scripts from the package directories.

Server scripts live in `server/package.json`:

```json
"dev": "bun run --watch src/server.ts",
"build": "bun build src/server.ts --outdir dist --target bun",
"start": "bun run dist/server.js",
"test": "vitest run",
"test:watch": "vitest",
"db:migrate": "<ORM-specific migrate command>",
"db:generate": "<ORM-specific generate command>"
```

Client scripts live in `client/package.json`:

```json
"dev": "vite",
"build": "tsc --noEmit && vite build",
"preview": "vite preview",
"test": "vitest run",
"test:watch": "vitest"
```

---

## Server Entry Point Behavior

`server/src/app.ts` must:
- **CORS:** use the `cors` package, configured to allow `http://localhost:5173` in development. CORS must be the **first** middleware registered.
- Mount all routes under `/api`
- Use `errorHandler` and `notFound` middleware (registered last, in that order)
- Export the configured Express app or an app factory for tests

`server/src/server.ts` must:
- Load `server/.env` via Bun's built-in env or `dotenv`
- Initialize the DB connection if required by the selected ORM/auth path
- Import the app from `app.ts`
- Listen on `PORT=8080` from env
- Log startup info: port, DB connection status, environment

Do not generate `server/src/index.ts` in the MVP.

### Health Check Route
`GET /api/health` — handled in `server/src/routes/health.ts`, returns:
```json
{ "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }
```
No DB call. Pure uptime check. HTTP 200 always.

---

## Client Behavior

### Axios Instance (`client/src/lib/axios.ts`)
- Create and export a configured `axios` instance as the **only** way to make API calls — no raw `fetch` or bare `axios` calls anywhere in the client
- Base URL set from `import.meta.env.VITE_API_URL`
- Default headers: `Content-Type: application/json`
- Interceptors:
  - **Request:** attach auth token from localStorage if present (slot ready, no-op for MVP)
  - **Response:** normalize error shape — extract `error.response.data.message` and re-throw as a standard `Error`

### TanStack Query (`client/src/lib/queryClient.ts`)
- Create and export a single `QueryClient` instance with sensible defaults:
  - `staleTime: 1000 * 60` (1 minute)
  - `retry: 1`
- Wrap `App.tsx` in `<QueryClientProvider client={queryClient}>`

### Routing
- Use `react-router-dom`.
- Route `/` renders a simple starter/landing page.
- Route `/health` renders the API health status page.
- Include a small shared layout/nav with links to `/` and `/health`.
- Do not generate frontend auth pages in the MVP.

### Health Check Integration
- Server exposes `GET /api/health` → returns `{ status: 'ok', timestamp: string }`
- Client: `client/src/hooks/useHealthCheck.ts` — a custom hook using `useQuery` that calls the health endpoint via the axios instance
- `HealthPage.tsx` calls `useHealthCheck()` and renders one of:
  - `API connected ✅` (status ok)
  - `API unavailable ❌` (error or loading)
- The health page proves the full stack is wired correctly; the landing page gives the starter a basic home screen.

---

## CLI Tool Internal Architecture

```text
src/
├── index.ts           # Entry point, arg parsing, calls runCLI()
├── cli.ts             # Prompt orchestration with @clack/prompts
├── scaffold.ts        # Reads user choices, calls generators
├── generators/
│   ├── base.ts        # Copies shared base templates
│   ├── orm.ts         # ORM-specific file generation (prisma | drizzle)
│   ├── auth.ts        # Auth-specific file generation
│   └── docker.ts      # docker-compose generation
├── templates/         # Static template files (copied verbatim or with tokens replaced)
│   ├── base/
│   ├── orm/
│   │   ├── prisma/
│   │   └── drizzle/
│   └── auth/
│       ├── jwt/
│       └── session/
└── utils/
    ├── files.ts       # File write helpers using Bun.file / Bun.write
    ├── pkgManager.ts  # Detect bun/npm/pnpm, run install
    └── logger.ts      # Colored console output helpers
```

### Token Replacement
Templates may contain `{{PROJECT_NAME}}`, `{{DB_NAME}}` etc. The generator replaces these with actual values before writing. Use simple `string.replaceAll()` — no template engine needed.

### Hybrid Template/Generator Strategy

Use static templates for files whose content never changes or barely changes by user choice. Use generator functions for files whose content changes significantly based on ORM/auth/database choices. Do not create full combination templates such as `prisma-jwt`, `prisma-session`, `drizzle-jwt`, etc. Do not write large TypeScript output files as unreadable string literals inside generator code when a static template is clearer.

Static template examples:

| File | Reason |
|---|---|
| `server/src/middleware/errorHandler.ts` | Same for every generated app |
| `server/src/middleware/notFound.ts` | Same for every generated app |
| `server/tsconfig.json` | Same for every generated server |
| `client/vite.config.ts` | Same for every generated client |
| `client/tsconfig.json` | Same for every generated client |
| `.gitignore` | Same for every generated app |
| `.prettierrc` | Same when formatting is selected |
| `prisma/schema.prisma` | ORM-specific but self-contained |
| `server/src/db/schema.ts` for Drizzle | ORM-specific but self-contained |
| `client/src/pages/HomePage.tsx` | Same for every generated client |
| `client/src/pages/HealthPage.tsx` | Same for every generated client |
| `client/src/hooks/useHealthCheck.ts` | Same for every generated client |

Generator function examples:

| File | Reason |
|---|---|
| `server/src/app.ts` | Middleware/routes vary by auth choice |
| `server/src/server.ts` | DB startup behavior varies by ORM/setup path |
| `server/package.json` | Dependencies and DB scripts differ per ORM/auth/lint/test choices |
| `client/package.json` | Dependencies differ when JWT token helpers/tests/lint are selected |
| `server/src/db/index.ts` | Completely different per ORM |
| `server/.env.example` | Variables differ by auth/ORM choices |
| `server/.env` | Values differ by Docker/custom DB/auth secrets |
| `client/.env.example` and `client/.env` | Values depend on configured API URL |

---

## Post-Scaffold Steps (automated)

After all files are written, the CLI automatically:
1. Runs `bun install` inside `client/` and `server/`
2. If DB setup was selected:
   - With Docker Compose: runs `docker compose up -d`, then runs the selected ORM migration command from `server/`
   - With a provided connection string: writes it to `server/.env`, then runs the selected ORM migration command from `server/`
   - If DB setup fails: leaves files intact, skips the initial git commit, and prints recovery commands
3. If **Git init** was selected and required generation/install steps succeeded: runs `git init` + `git add .` + `git commit -m "chore: initial commit from create-pern-app"`
4. Prints a styled **success box** with next steps:

```text
✅ Your PERN app is ready!

Next steps:
  cd my-pern-app
  docker compose up -d        ← if Docker Compose was selected and not already started
  cd server && bun run db:migrate
  cd server && bun run dev
  cd client && bun run dev
```

The CLI targets local interactive project setup. Network dependency installation is expected. Keep a non-interactive `--skip-install` flag for CLI development/tests, but do not prompt normal users for it and do not emphasize it in generated app docs.

---

## CLI Tool — Local Development & Testing

> **MVP: no npm publish. Test locally using Bun directly.**

### `package.json` for the CLI tool itself:
```json
{
  "name": "create-pern-app",
  "version": "0.1.0",
  "description": "Scaffold a full-stack PERN + TypeScript project",
  "bin": {
    "create-pern-app": "./dist/index.js"
  },
  "scripts": {
    "build": "bun build src/index.ts --outdir dist --target node",
    "dev": "bun run src/index.ts",
    "test": "bun test",
    "prepublishOnly": "bun run build"
  },
  "files": ["dist", "src/templates"]
}
```

### Running Locally
```bash
# Run without building
bun run src/index.ts

# Or build first and run the binary directly
bun run build
node dist/index.js

# Run tests
bun test
```

- Bundle with `bun build` targeting Node (for future `npx` compatibility)
- Templates folder must be included in `files` array
- The shebang `#!/usr/bin/env node` must be the first line of the built output
- Use `--skip-install` in CLI development tests to avoid network dependency installation when generating fixtures

---

## Constraints & Rules for Agent

1. **Use Bun APIs** (`Bun.file`, `Bun.write`, `$`) wherever possible over Node equivalents
2. **No runtime dependencies** in the CLI tool except `@clack/prompts` — everything else is Bun built-ins
3. **Generated project must work with `bun install` in `client/` and `server/`** — no npm-only scripts
4. **TypeScript strict mode** (`"strict": true`) in every `tsconfig.json` — no `any` shortcuts
5. **No `create-react-app`** — use Vite for the React frontend
6. **Express version 5** (current stable) for the server
7. All template files must be valid TypeScript — the scaffolded project must compile with zero errors out of the box
8. Test the CLI end-to-end by running it and verifying the output compiles: `cd output-project/server && bun tsc --noEmit`; also verify the generated client compiles
9. The CLI must handle **Ctrl+C gracefully** at any prompt (via `@clack/prompts` cancel handling)
10. README.md in the generated project must document every `client/` and `server/` script and every env variable

---

## TDD Requirements

> **All development must follow Test-Driven Development: write the test first, make it fail, then write the implementation.**

### CLI Tool Tests (Bun test runner)
- `src/__tests__/scaffold.test.ts` — unit tests for scaffold logic (file tree generation, token replacement)
- `src/__tests__/generators/orm.test.ts` — verify correct files are generated per ORM choice
- `src/__tests__/generators/base.test.ts` — verify base template files are always written
- `src/__tests__/utils/files.test.ts` — test file write helpers with temp directories
- `src/__tests__/utils/logger.test.ts` — test log output format

### Generated Server Tests (Vitest + Supertest)
Every generated server project must include a working test suite under `server/src/__tests__/`:

- `health.test.ts` — `GET /api/health` returns 200 + `{ status: 'ok', timestamp: ... }`
- `middleware/errorHandler.test.ts` — error middleware returns correct shape
- `middleware/notFound.test.ts` — unknown routes return 404

Test setup file: `server/src/test/setup.ts`
- Imports the Express app from `server/src/app.ts`
- Uses Supertest against the app directly; do not bind a fixed port for route tests

Scripts in `server/package.json`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

### Generated Client Tests (Vitest + React Testing Library)
- `client/src/__tests__/App.test.tsx` — renders the landing route and can navigate to the health route
- `client/src/__tests__/pages/HealthPage.test.tsx` — renders "API connected" when health query returns ok; renders "API unavailable" on error
- `client/src/__tests__/hooks/useHealthCheck.test.ts` — hook returns correct states (loading, success, error)
- MSW (Mock Service Worker) used to mock the axios calls in client tests

Scripts in `client/package.json`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

There is no root test script in MVP. Run generated tests from each package directory:

```bash
cd server && bun run test
cd client && bun run test
```

---

## Clean Code Architecture Rules

> These rules apply to all generated code. The agent must enforce them throughout.

1. **Single responsibility per file** — one controller, one route group, one hook, one utility per file. No "god files".
2. **Controllers are thin** — controllers only call service/helper functions and return responses. Zero business logic in controllers.
3. **No inline logic in routes** — route files only mount controllers. No anonymous handler functions with logic in them.
4. **Helpers/utils for everything reusable** — any logic used more than once must be extracted into a helper. Examples:
   - `server/src/utils/response.ts` — `sendSuccess(res, data)`, `sendError(res, message, status)`
   - `server/src/utils/env.ts` — typed env variable accessors (no raw `process.env.X` scattered in code)
   - `client/src/utils/queryKeys.ts` — centralized TanStack Query key factory
5. **No function longer than 20 lines** — if a function exceeds this, extract helpers.
6. **Named exports only** — no default exports except for React components and route files.
7. **No magic strings or numbers** — use constants files (`server/src/constants/index.ts`, `client/src/constants/index.ts`)
8. **Error handling is centralized** — never `try/catch` in controllers; use the `errorHandler` middleware and throw typed errors upstream

---

## MVP Scope — What's In vs Out

### ✅ In Scope (MVP)
- ORM choice: Prisma or Drizzle only
- Auth prompt scaffolding (JWT or Session or None)
- Docker Compose option
- ESLint + Prettier option
- Git init option
- User table schema + initial migration flow; migration execution only when DB setup is explicitly selected and a database is reachable
- Express on port 8080, React/Vite on port 5173
- CORS configured for `localhost:5173`
- Axios instance + TanStack Query in client
- React Router with `/` landing page and `/health` health check page
- Health check endpoint wired end-to-end
- Full TDD test suites (CLI tool + server + client)
- Clean code architecture enforced throughout
- Local testing only — no npm publish

### ❌ Out of Scope (future)
- npm publish / npx distribution
- TypeORM, raw pg driver
- CI/CD pipeline generation
- Deployment configs (Fly.io, Railway, etc.)
- Frontend auth pages (`/register`, `/login`)
- Router choice prompt; MVP always uses `react-router-dom`
- State management choice — no opinion, user adds their own
- Non-PostgreSQL databases
