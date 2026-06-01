import { describe, expect, it } from "bun:test";
import { generateBaseFiles } from "../../generators/base";
import { baseOptions } from "../testUtils";

describe("generateBaseFiles", () => {
  it("always writes client and server base files", () => {
    const files = generateBaseFiles(baseOptions());
    const paths = files.map((file) => file.path);

    expect(paths).toContain("client/public/.gitkeep");
    expect(paths).toContain("client/src/components/.gitkeep");
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
});
