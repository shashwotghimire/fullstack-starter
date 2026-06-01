import { describe, expect, it } from "bun:test";
import { generateAuthFiles } from "../../generators/auth";
import { baseOptions } from "../testUtils";

describe("generateAuthFiles", () => {
  it("generates JWT auth files backed by Prisma", () => {
    const files = generateAuthFiles(baseOptions({ auth: "jwt", orm: "prisma" }));
    const paths = files.map((file) => file.path);
    const service = files.find((file) => file.path === "server/src/services/authService.ts");

    expect(paths).toContain("server/src/routes/auth.ts");
    expect(paths).toContain("server/src/middleware/auth.ts");
    expect(service?.contents).toContain("db.user.create");
    expect(service?.contents).toContain("bcrypt.compare");
  });

  it("generates JWT auth files backed by Drizzle", () => {
    const files = generateAuthFiles(baseOptions({ auth: "jwt", orm: "drizzle" }));
    const service = files.find((file) => file.path === "server/src/services/authService.ts");

    expect(service?.contents).toContain("insert(users)");
    expect(service?.contents).toContain("eq(users.email");
  });

  it("generates session middleware for session auth", () => {
    const files = generateAuthFiles(baseOptions({ auth: "session" }));

    expect(files.map((file) => file.path)).toEqual(["server/src/middleware/session.ts"]);
    expect(files[0]?.contents).toContain("connect-pg-simple");
  });
});
