import type { FileEntry, ScaffoldOptions } from "../types";
import { readTemplate } from "../utils/templates";

function parseDependency(entry: string): [string, string] {
  const [name, version] = entry.replaceAll('"', "").split(": ");
  return [name, version];
}

function serverPackageJson(options: ScaffoldOptions): string {
  const deps = [
    '"cors": "^2.8.5"',
    '"express": "^5.0.1"',
    options.orm === "prisma" ? '"@prisma/client": "^6.0.1"' : '"drizzle-orm": "^0.36.4"',
    options.orm === "drizzle" ? '"postgres": "^3.4.5"' : "",
    options.auth === "jwt" ? '"bcryptjs": "^2.4.3"' : "",
    options.auth === "jwt" ? '"jsonwebtoken": "^9.0.2"' : "",
    options.auth === "jwt" ? '"zod": "^3.24.1"' : "",
    options.auth === "session" ? '"connect-pg-simple": "^10.0.0"' : "",
    options.auth === "session" ? '"express-session": "^1.18.1"' : "",
  ].filter(Boolean);
  const devDeps = [
    '"@types/bcryptjs": "^2.4.6"',
    '"@types/cors": "^2.8.17"',
    '"@types/express": "^5.0.0"',
    '"@types/bun": "^1.2.0"',
    '"@types/jsonwebtoken": "^9.0.7"',
    options.auth === "session" ? '"@types/connect-pg-simple": "^7.0.3"' : "",
    options.auth === "session" ? '"@types/express-session": "^1.18.0"' : "",
    '"@types/supertest": "^6.0.2"',
    '"supertest": "^7.0.0"',
    '"typescript": "^5.6.3"',
    '"vitest": "^2.1.8"',
    options.lint ? '"@eslint/js": "^9.16.0"' : "",
    options.lint ? '"eslint": "^9.16.0"' : "",
    options.lint ? '"prettier": "^3.4.2"' : "",
    options.lint ? '"typescript-eslint": "^8.18.0"' : "",
    options.orm === "prisma" ? '"prisma": "^6.0.1"' : '"drizzle-kit": "^0.27.2"',
  ].filter((dep) => dep && (options.auth === "jwt" || (!dep.includes("bcryptjs") && !dep.includes("jsonwebtoken"))));
  const dbScripts =
    options.orm === "prisma"
      ? {
          postinstall: "PRISMA_GENERATE_SKIP_AUTOINSTALL=1 prisma generate --schema ../prisma/schema.prisma",
          "db:generate": "PRISMA_GENERATE_SKIP_AUTOINSTALL=1 prisma generate --schema ../prisma/schema.prisma",
          "db:migrate": "prisma migrate dev --schema ../prisma/schema.prisma",
          "db:migrate:init": "prisma migrate dev --name init --schema ../prisma/schema.prisma",
          "db:migrate:prod": "prisma migrate deploy --schema ../prisma/schema.prisma",
          "db:studio": "prisma studio --schema ../prisma/schema.prisma",
        }
      : {
          "db:generate": "drizzle-kit generate",
          "db:migrate": "drizzle-kit migrate",
        };

  return JSON.stringify(
    {
      name: "{{PROJECT_NAME}}-server",
      type: "module",
      scripts: {
        dev: "bun run --watch src/server.ts",
        build: "bun build src/server.ts --outdir dist --target bun",
        start: "bun run dist/server.js",
        test: "vitest run",
        "test:watch": "vitest",
        ...(options.lint ? { lint: "eslint .", format: "prettier --write ." } : {}),
        ...dbScripts,
      },
      dependencies: Object.fromEntries(deps.map(parseDependency)),
      devDependencies: Object.fromEntries(devDeps.map(parseDependency)),
    },
    null,
    2,
  );
}

function clientPackageJson(options: ScaffoldOptions): string {
  return JSON.stringify(
    {
      name: "{{PROJECT_NAME}}-client",
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc --noEmit && vite build",
        preview: "vite preview",
        test: "vitest run",
        "test:watch": "vitest",
        ...(options.lint ? { lint: "eslint .", format: "prettier --write ." } : {}),
      },
      dependencies: {
        "@tanstack/react-query": "^5.62.8",
        axios: "^1.7.9",
        react: "^18.3.1",
        "react-dom": "^18.3.1",
        "react-router-dom": "^7.0.2",
      },
      devDependencies: {
        "@testing-library/jest-dom": "^6.6.3",
        "@testing-library/react": "^16.1.0",
        "@testing-library/user-event": "^14.5.2",
        "@types/react": "^18.3.12",
        "@types/react-dom": "^18.3.1",
        "@types/bun": "^1.2.0",
        "@vitejs/plugin-react": "^4.3.4",
        jsdom: "^25.0.1",
        msw: "1.3.5",
        ...(options.lint
          ? {
              "@eslint/js": "^9.16.0",
              eslint: "^9.16.0",
              prettier: "^3.4.2",
              "typescript-eslint": "^8.18.0",
            }
          : {}),
        typescript: "^5.6.3",
        vite: "^6.0.3",
        vitest: "^2.1.8",
      },
    },
    null,
    2,
  );
}

function eslintConfig(): string {
  return `import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["dist", "node_modules"],
    languageOptions: {
      globals: {
        Bun: "readonly",
        console: "readonly",
        document: "readonly",
        localStorage: "readonly",
        process: "readonly",
        window: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
);
`;
}

function serverEnvExample(options: ScaffoldOptions): string {
  const authLines =
    options.auth === "jwt"
      ? "\n# Auth\nJWT_SECRET=changeme\nJWT_EXPIRES_IN=15m\n"
      : options.auth === "session"
        ? "\n# Auth\nSESSION_SECRET=changeme\n"
        : "";

  return `# Server
PORT=8080
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/{{DB_NAME}}
${authLines}`;
}

function serverEnv(options: ScaffoldOptions): string {
  const dbUrl =
    options.databaseSetup.mode === "connection-string"
      ? options.databaseSetup.connectionString
      : "postgresql://postgres:postgres@localhost:5432/{{DB_NAME}}";
  const secret = crypto.randomUUID().replaceAll("-", "");
  const authLines =
    options.auth === "jwt"
      ? `\nJWT_SECRET=${secret}\nJWT_EXPIRES_IN=15m\n`
      : options.auth === "session"
        ? `\nSESSION_SECRET=${secret}\n`
        : "";

  return `PORT=8080
NODE_ENV=development
DATABASE_URL=${dbUrl}
${authLines}`;
}

function readme(options: ScaffoldOptions): string {
  const authVars =
    options.auth === "jwt"
      ? "- `JWT_SECRET`: signing secret for access tokens\n- `JWT_EXPIRES_IN`: access token lifetime\n"
      : options.auth === "session"
        ? "- `SESSION_SECRET`: secret for signed session cookies\n"
        : "";
  const ormScripts =
    options.orm === "prisma"
      ? "- `bun run db:migrate:init`: run the initial Prisma migration\n- `bun run db:migrate:prod`: deploy Prisma migrations in production\n- `bun run db:studio`: open Prisma Studio\n"
      : "";

  return `# {{PROJECT_NAME}}

Generated by create-pern-app.

## Client scripts

- \`bun run dev\`: start Vite on port 5173
- \`bun run build\`: type-check and build the client
- \`bun run preview\`: preview the production client
- \`bun run test\`: run client tests
- \`bun run test:watch\`: run client tests in watch mode
${options.lint ? "- `bun run lint`: run client lint checks\n- `bun run format`: format client files\n" : ""}

## Server scripts

- \`bun run dev\`: start Express on port 8080
- \`bun run build\`: build the server
- \`bun run start\`: run the built server
- \`bun run test\`: run server tests
- \`bun run test:watch\`: run server tests in watch mode
${options.lint ? "- `bun run lint`: run server lint checks\n- `bun run format`: format server files\n" : ""}
- \`bun run db:generate\`: generate ORM artifacts
- \`bun run db:migrate\`: run local database migrations
${ormScripts}

## Environment variables

Server:

- \`PORT\`: server port
- \`NODE_ENV\`: runtime environment
- \`DATABASE_URL\`: PostgreSQL connection string
${authVars}
Client:

- \`VITE_API_URL\`: server origin for API calls
`;
}

function serverEntry(): string {
  return `import { app } from "./app";
import { connectDb } from "./db";
import { getNodeEnv, getPort } from "./utils/env";

const port = getPort();

await connectDb();

app.listen(port, () => {
  console.info(\`Server listening on port \${port}\`);
  console.info(\`Environment: \${getNodeEnv()}\`);
  console.info("Database: connected");
});
`;
}

export function generateBaseFiles(options: ScaffoldOptions): FileEntry[] {
  const routesIndex =
    options.auth === "jwt"
      ? `import { Router } from "express";
import authRouter from "./auth";
import healthRouter from "./health";

const router = Router();

router.use("/auth", authRouter);
router.use("/health", healthRouter);

export default router;
`
      : `import { Router } from "express";
import healthRouter from "./health";

const router = Router();

router.use("/health", healthRouter);

export default router;
`;
  const sessionImport =
    options.auth === "session" ? `import { sessionMiddleware } from "./middleware/session";\n` : "";
  const sessionUse = options.auth === "session" ? `  app.use(sessionMiddleware);\n` : "";
  const files: FileEntry[] = [
    { path: ".gitignore", contents: readTemplate("base/.gitignore") },
    { path: "README.md", contents: readme(options) },
    { path: "server/package.json", contents: serverPackageJson(options) },
    { path: "server/.env.example", contents: serverEnvExample(options) },
    { path: "client/package.json", contents: clientPackageJson(options) },
    { path: "client/.env.example", contents: "VITE_API_URL=http://localhost:8080\n" },
    { path: "client/.env", contents: "VITE_API_URL=http://localhost:8080\n" },
    { path: "client/public/.gitkeep", contents: "" },
    { path: "client/src/components/.gitkeep", contents: "" },
    {
      path: "server/tsconfig.json",
      contents: readTemplate("base/server/tsconfig.json"),
    },
    {
      path: "client/tsconfig.json",
      contents: readTemplate("base/client/tsconfig.json"),
    },
    {
      path: "client/vite.config.ts",
      contents: readTemplate("base/client/vite.config.ts"),
    },
    { path: "server/src/constants/index.ts", contents: `export const defaultPort = 8080;\nexport const clientOrigin = "http://localhost:5173";\n` },
    { path: "client/src/constants/index.ts", contents: `export const routes = { home: "/", health: "/health" } as const;\n` },
    { path: "server/src/types/index.ts", contents: `export type HealthResponse = { status: "ok"; timestamp: string };\n` },
    { path: "server/src/utils/env.ts", contents: `import { defaultPort } from "../constants";

const bunEnv = typeof Bun === "undefined" ? undefined : Bun.env;

export function getEnv(name: string, fallback?: string): string {
  const value = bunEnv?.[name] ?? process.env[name] ?? fallback;
  if (!value) {
    throw new Error(\`Missing environment variable: \${name}\`);
  }
  return value;
}

export function getPort(): number {
  return Number(getEnv("PORT", String(defaultPort)));
}

export function getNodeEnv(): string {
  return getEnv("NODE_ENV", "development");
}
` },
    { path: "server/src/utils/response.ts", contents: readTemplate("base/server/src/utils/response.ts") },
    { path: "server/src/controllers/healthController.ts", contents: `import type { Request, Response } from "express";
import { sendSuccess } from "../utils/response";

export function getHealth(_req: Request, res: Response): void {
  sendSuccess(res, { status: "ok", timestamp: new Date().toISOString() });
}
` },
    { path: "server/src/routes/health.ts", contents: `import { Router } from "express";
import { getHealth } from "../controllers/healthController";

const router = Router();

router.get("/", getHealth);

export default router;
` },
    { path: "server/src/routes/index.ts", contents: routesIndex },
    { path: "server/src/middleware/notFound.ts", contents: readTemplate("base/server/src/middleware/notFound.ts") },
    { path: "server/src/middleware/errorHandler.ts", contents: readTemplate("base/server/src/middleware/errorHandler.ts") },
    { path: "server/src/app.ts", contents: `import cors from "cors";
import express from "express";
import { clientOrigin } from "./constants";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
${sessionImport}import apiRouter from "./routes";

export function createApp(): express.Express {
  const app = express();
  app.use(cors({ origin: clientOrigin }));
  app.use(express.json());
${sessionUse}  app.use("/api", apiRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

export const app = createApp();
` },
    { path: "server/src/server.ts", contents: serverEntry() },
    { path: "server/src/test/setup.ts", contents: `process.env.PORT ??= "8080";
process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/{{DB_NAME}}";
process.env.JWT_SECRET ??= "test-secret";
process.env.JWT_EXPIRES_IN ??= "15m";
process.env.SESSION_SECRET ??= "test-secret";

const appModule = await import("../app");

export const app = appModule.app;
` },
    { path: "server/src/__tests__/health.test.ts", contents: `import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../test/setup";

describe("GET /api/health", () => {
  it("returns health status", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(typeof response.body.timestamp).toBe("string");
  });
});
` },
    { path: "server/src/__tests__/middleware/notFound.test.ts", contents: `import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../test/setup";

describe("notFound", () => {
  it("returns 404 for unknown routes", async () => {
    const response = await request(app).get("/missing");
    expect(response.status).toBe(404);
    expect(response.body.message).toContain("Route not found");
  });
});
` },
    { path: "server/src/__tests__/middleware/errorHandler.test.ts", contents: `import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { errorHandler } from "../../middleware/errorHandler";

describe("errorHandler", () => {
  it("returns a normalized error response", async () => {
    const app = express();
    app.get("/boom", (_req, _res, next) => next(new Error("Boom")));
    app.use(errorHandler);
    const response = await request(app).get("/boom");
    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Boom");
  });
});
` },
    { path: "client/index.html", contents: `<div id="root"></div><script type="module" src="/src/main.tsx"></script>\n` },
    { path: "client/src/lib/auth.ts", contents: `const tokenKey = "create-pern-app-token";

export function getAuthToken(): string | null {
  return localStorage.getItem(tokenKey);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(tokenKey, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(tokenKey);
}
` },
    { path: "client/src/lib/axios.ts", contents: `import axios from "axios";
import { getAuthToken } from "./auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const message = (error.response?.data as { message?: string } | undefined)?.message;
      throw new Error(message ?? error.message);
    }
    throw error;
  },
);
` },
    { path: "client/src/lib/queryClient.ts", contents: `import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});
` },
    { path: "client/src/utils/queryKeys.ts", contents: `export const queryKeys = {
  health: ["health"] as const,
};
` },
    { path: "client/src/hooks/useHealthCheck.ts", contents: readTemplate("base/client/src/hooks/useHealthCheck.ts") },
    { path: "client/src/pages/HomePage.tsx", contents: readTemplate("base/client/src/pages/HomePage.tsx") },
    { path: "client/src/pages/HealthPage.tsx", contents: readTemplate("base/client/src/pages/HealthPage.tsx") },
    { path: "client/src/App.tsx", contents: `import { Link, Route, Routes } from "react-router-dom";
import { routes } from "./constants";
import HealthPage from "./pages/HealthPage";
import HomePage from "./pages/HomePage";

export default function App() {
  return (
    <>
      <nav>
        <Link to={routes.home}>Home</Link>
        <Link to={routes.health}>Health</Link>
      </nav>
      <Routes>
        <Route path={routes.home} element={<HomePage />} />
        <Route path={routes.health} element={<HealthPage />} />
      </Routes>
    </>
  );
}
` },
    { path: "client/src/main.tsx", contents: `import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { queryClient } from "./lib/queryClient";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
` },
    { path: "client/src/test/handlers.ts", contents: `import { rest } from "msw";

export const handlers = [
  rest.get("http://localhost:8080/api/health", (_req, res, ctx) =>
    res(ctx.json({ status: "ok", timestamp: "2024-01-01T00:00:00.000Z" })),
  ),
];
` },
    { path: "client/src/test/server.ts", contents: `import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
` },
    { path: "client/src/test/setup.ts", contents: `import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
` },
    { path: "client/src/__tests__/App.test.tsx", contents: `import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "../App";
import { queryClient } from "../lib/queryClient";

describe("App", () => {
  it("renders home and navigates to health", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByRole("heading", { name: "{{PROJECT_NAME}}" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: "Health" }));
    expect(screen.getByText(/API unavailable|API connected/)).toBeInTheDocument();
  });
});
` },
    { path: "client/src/__tests__/pages/HealthPage.test.tsx", contents: `import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { rest } from "msw";
import { describe, expect, it } from "vitest";
import HealthPage from "../../pages/HealthPage";
import { server } from "../../test/server";

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <HealthPage />
    </QueryClientProvider>,
  );
}

describe("HealthPage", () => {
  it("renders connected when health succeeds", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("API connected ✅")).toBeInTheDocument());
  });

  it("renders unavailable when health fails", async () => {
    server.use(rest.get("http://localhost:8080/api/health", (_req, res) => res.networkError("offline")));
    renderPage();
    await waitFor(() => expect(screen.getByText("API unavailable ❌")).toBeInTheDocument());
  });
});
` },
    { path: "client/src/__tests__/hooks/useHealthCheck.test.ts", contents: `import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { rest } from "msw";
import { createElement } from "react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { useHealthCheck } from "../../hooks/useHealthCheck";
import { server } from "../../test/server";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

describe("useHealthCheck", () => {
  it("returns loading state", () => {
    const { result } = renderHook(() => useHealthCheck(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it("returns success state", async () => {
    const { result } = renderHook(() => useHealthCheck(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("returns error state", async () => {
    server.use(rest.get("http://localhost:8080/api/health", (_req, res) => res.networkError("offline")));
    const { result } = renderHook(() => useHealthCheck(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
` },
  ];

  if (options.docker || options.databaseSetup.mode === "connection-string" || options.auth !== "none") {
    files.push({ path: "server/.env", contents: serverEnv(options) });
  }

  if (options.lint) {
    files.push({ path: ".prettierrc", contents: `{"semi":true,"singleQuote":false,"printWidth":100}\n` });
    files.push({ path: "server/eslint.config.js", contents: eslintConfig() });
    files.push({ path: "client/eslint.config.js", contents: eslintConfig() });
  }

  return files;
}
