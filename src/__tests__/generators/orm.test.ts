import { describe, expect, it } from "bun:test";
import { generateOrmFiles } from "../../generators/orm";
import { baseOptions } from "../testUtils";

describe("generateOrmFiles", () => {
  it("generates Prisma schema and singleton client", () => {
    const files = generateOrmFiles(baseOptions({ orm: "prisma" }));
    const paths = files.map((file) => file.path);

    expect(paths).toContain("prisma/schema.prisma");
    expect(paths).toContain("server/src/db/index.ts");
    expect(files.find((file) => file.path === "prisma/schema.prisma")?.contents).toContain(
      "model User",
    );
    expect(files.find((file) => file.path === "server/src/db/index.ts")?.contents).toContain(
      "connectDb",
    );
  });

  it("generates Drizzle schema and config", () => {
    const files = generateOrmFiles(baseOptions({ orm: "drizzle" }));
    const paths = files.map((file) => file.path);

    expect(paths).toContain("drizzle.config.ts");
    expect(paths).toContain("server/src/db/schema.ts");
    expect(paths).toContain("server/src/db/migrations/.gitkeep");
    expect(files.find((file) => file.path === "server/src/db/schema.ts")?.contents).toContain(
      'pgTable("users"',
    );
    expect(files.find((file) => file.path === "server/src/db/index.ts")?.contents).toContain(
      "connectDb",
    );
    expect(files.find((file) => file.path === "server/src/db/index.ts")?.contents).toContain(
      "select 1",
    );
  });

  it("generates Sequelize models, config, and migration", () => {
    const files = generateOrmFiles(baseOptions({ orm: "sequelize" }));
    const paths = files.map((file) => file.path);

    expect(paths).toContain("config/config.js");
    expect(paths).toContain("sequelize/migrations/001-create-users.cjs");
    expect(paths).toContain("server/src/db/index.ts");
    expect(paths).toContain("server/src/db/models/user.ts");
    expect(files.find((file) => file.path === "server/src/db/models/user.ts")?.contents).toContain(
      "class User",
    );
    expect(files.find((file) => file.path === "server/src/db/index.ts")?.contents).toContain(
      "sequelize.authenticate",
    );
    expect(files.find((file) => file.path === "config/config.js")?.contents).toContain(
      "module.exports",
    );
  });
});
