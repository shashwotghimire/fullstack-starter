import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "bun:test";
import { getRuntimeArgv, renderTemplate, writeTextFile } from "../../utils/files";
import { cleanup, read, tempProjectDir } from "../testUtils";

describe("files utilities", () => {
  it("reads CLI args from a supplied runtime argv", () => {
    expect(getRuntimeArgv(["bun", "src/index.ts", "demo-app"])).toEqual(["demo-app"]);
    expect(getRuntimeArgv(undefined, ["node", "dist/index.js", "demo-app"])).toEqual(["demo-app"]);
  });

  it("replaces all template tokens", () => {
    const result = renderTemplate("{{PROJECT_NAME}}/{{PROJECT_NAME}}/{{DB_NAME}}", {
      PROJECT_NAME: "sample-app",
      DB_NAME: "sample_app",
    });

    expect(result).toBe("sample-app/sample-app/sample_app");
  });

  it("creates parent directories when writing files", async () => {
    const targetDir = await tempProjectDir();
    const filePath = join(targetDir, "nested/file.txt");

    try {
      await writeTextFile(filePath, "hello");
      expect(existsSync(filePath)).toBe(true);
      expect(await read(filePath)).toBe("hello");
    } finally {
      await cleanup(targetDir);
    }
  });
});
