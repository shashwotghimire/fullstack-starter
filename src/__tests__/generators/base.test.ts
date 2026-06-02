import { describe, expect, it } from "bun:test";
import { generateBaseFiles } from "../../generators/base";
import { baseOptions } from "../testUtils";

describe("generateBaseFiles", () => {
  it("always writes client and server base files", () => {
    const files = generateBaseFiles(baseOptions());
    const paths = files.map((file) => file.path);

    expect(paths).toContain("client/public/.gitkeep");
    expect(paths).toContain("client/components.json");
    expect(paths).toContain("client/src/components/ui/button.tsx");
    expect(paths).toContain("client/src/components/ui/card.tsx");
    expect(paths).toContain("client/src/index.css");
    expect(paths).toContain("client/src/pages/HomePage.tsx");
    expect(paths).toContain("client/src/pages/HealthPage.tsx");
    expect(paths).toContain("server/src/routes/health.ts");
    expect(paths).toContain("server/src/__tests__/health.test.ts");
  });

  it("documents Prisma-specific scripts in generated README", () => {
    const readme = generateBaseFiles(baseOptions({ orm: "prisma" })).find(
      (file) => file.path === "README.md",
    );

    expect(readme?.contents).toContain("bun run db:migrate:init");
    expect(readme?.contents).toContain("bun run db:migrate:prod");
    expect(readme?.contents).toContain("bun run db:studio");
  });

  it("generates Sequelize server dependencies and migration scripts", () => {
    const packageJson = generateBaseFiles(baseOptions({ orm: "sequelize" })).find(
      (file) => file.path === "server/package.json",
    );

    expect(packageJson?.contents).toContain('"sequelize": "^6.37.8"');
    expect(packageJson?.contents).toContain('"pg": "^8.21.0"');
    expect(packageJson?.contents).toContain('"pg-hstore": "^2.3.4"');
    expect(packageJson?.contents).toContain('"sequelize-cli": "^6.6.3"');
    expect(packageJson?.contents).toContain("sequelize-cli db:migrate");
    expect(packageJson?.contents).toContain("--config ../config/config.js");
  });

  it("generates hook tests for loading, success, and error states", () => {
    const hookTest = generateBaseFiles(baseOptions()).find(
      (file) => file.path === "client/src/__tests__/hooks/useHealthCheck.test.ts",
    );

    expect(hookTest?.contents).toContain("returns loading state");
    expect(hookTest?.contents).toContain("returns success state");
    expect(hookTest?.contents).toContain("returns error state");
  });

  it("allows intentionally unused Express middleware arguments in lint config", () => {
    const eslint = generateBaseFiles(baseOptions({ lint: true })).find(
      (file) => file.path === "server/eslint.config.js",
    );

    expect(eslint?.contents).toContain("argsIgnorePattern");
    expect(eslint?.contents).toContain("^_");
  });

  it("mounts auth routes when JWT auth is selected", () => {
    const routes = generateBaseFiles(baseOptions({ auth: "jwt" })).find(
      (file) => file.path === "server/src/routes/index.ts",
    );

    expect(routes?.contents).toContain('router.use("/auth", authRouter)');
  });

  it("does not explicitly connect Prisma on server startup", () => {
    const server = generateBaseFiles(baseOptions({ orm: "prisma" })).find(
      (file) => file.path === "server/src/server.ts",
    );

    expect(server?.contents).not.toContain('import { connectDb } from "./db"');
    expect(server?.contents).not.toContain("connectDb()");
    expect(server?.contents).toContain("Database: lazy Prisma connection");
  });

  it("does not block startup when a non-Prisma database is unavailable", () => {
    const server = generateBaseFiles(baseOptions({ orm: "sequelize" })).find(
      (file) => file.path === "server/src/server.ts",
    );

    expect(server?.contents).toContain('import { connectDb } from "./db"');
    expect(server?.contents).toContain("connectDb().then");
    expect(server?.contents).toContain("Database: unavailable");
    expect(server?.contents).not.toContain("await connectDb()");
  });

  it("centralizes generated client auth constants", () => {
    const files = generateBaseFiles(baseOptions());
    const constants = files.find((file) => file.path === "client/src/constants/index.ts");
    const auth = files.find((file) => file.path === "client/src/lib/auth.ts");

    expect(constants?.contents).toContain("authTokenStorageKey");
    expect(auth?.contents).toContain('import { authTokenStorageKey } from "../constants"');
    expect(auth?.contents).not.toContain("create-pern-app-token");
  });

  it("centralizes generated server HTTP status constants", () => {
    const files = generateBaseFiles(baseOptions());
    const constants = files.find((file) => file.path === "server/src/constants/index.ts");
    const notFound = files.find((file) => file.path === "server/src/middleware/notFound.ts");
    const errorHandler = files.find((file) => file.path === "server/src/middleware/errorHandler.ts");

    expect(constants?.contents).toContain("httpStatus");
    expect(notFound?.contents).toContain("httpStatus.notFound");
    expect(errorHandler?.contents).toContain("httpStatus.internalServerError");
  });

  it("generates Tailwind CSS and shadcn configuration for the client", () => {
    const files = generateBaseFiles(baseOptions());
    const packageJson = files.find((file) => file.path === "client/package.json");
    const viteConfig = files.find((file) => file.path === "client/vite.config.ts");
    const css = files.find((file) => file.path === "client/src/index.css");
    const components = files.find((file) => file.path === "client/components.json");

    expect(packageJson?.contents).toContain('"tailwindcss": "^4.3.0"');
    expect(packageJson?.contents).toContain('"@tailwindcss/vite": "^4.3.0"');
    expect(packageJson?.contents).toContain('"shadcn": "^4.10.0"');
    expect(packageJson?.contents).toContain('"lucide-react": "^1.17.0"');
    expect(viteConfig?.contents).toContain("tailwindcss()");
    expect(css?.contents).toContain('@import "tailwindcss"');
    expect(components?.contents).toContain('"tailwind": {');
  });

  it("normalizes the generated client API base URL", () => {
    const axios = generateBaseFiles(baseOptions()).find(
      (file) => file.path === "client/src/lib/axios.ts",
    );

    expect(axios?.contents).toContain("apiBaseUrl");
    expect(axios?.contents).toContain("replace(/\\/+$/, \"\")");
    expect(axios?.contents).toContain('"http://localhost:8080"');
  });
});
