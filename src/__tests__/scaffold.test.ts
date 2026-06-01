import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "bun:test";
import { getDbSetupScripts, scaffoldProject } from "../scaffold";
import { baseOptions, cleanup, read, tempProjectDir } from "./testUtils";

describe("scaffoldProject", () => {
  it("plans ORM-specific database setup commands", () => {
    expect(getDbSetupScripts("prisma")).toEqual(["db:migrate:init"]);
    expect(getDbSetupScripts("drizzle")).toEqual(["db:generate", "db:migrate"]);
  });

  it("generates the expected project tree with token replacement", async () => {
    const targetDir = await tempProjectDir();

    try {
      await scaffoldProject(baseOptions({ projectName: "sample-app", targetDir }));
      expect(existsSync(join(targetDir, "client/src/App.tsx"))).toBe(true);
      expect(existsSync(join(targetDir, "server/src/app.ts"))).toBe(true);
      expect(existsSync(join(targetDir, "docker-compose.yml"))).toBe(true);

      const readme = await read(join(targetDir, "README.md"));
      const docker = await read(join(targetDir, "docker-compose.yml"));
      expect(readme).toContain("# sample-app");
      expect(docker).toContain("POSTGRES_DB: sample_app");
    } finally {
      await cleanup(targetDir);
    }
  });

  it("writes a provided database URL only to server .env", async () => {
    const targetDir = await tempProjectDir();
    const connectionString = "postgresql://user:pass@db.local:5432/app";

    try {
      await scaffoldProject(
        baseOptions({
          targetDir,
          docker: false,
          databaseSetup: { mode: "connection-string", connectionString },
        }),
      );

      expect(await read(join(targetDir, "server/.env"))).toContain(connectionString);
      expect(await read(join(targetDir, "server/.env.example"))).not.toContain(connectionString);
    } finally {
      await cleanup(targetDir);
    }
  });
});
