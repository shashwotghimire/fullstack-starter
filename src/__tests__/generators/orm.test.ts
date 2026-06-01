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
  });
});
