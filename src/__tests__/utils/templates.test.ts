import { describe, expect, it } from "bun:test";
import { readTemplate } from "../../utils/templates";

describe("template utilities", () => {
  it("reads static templates from src/templates", () => {
    expect(readTemplate("base/client/vite.config.ts")).toContain("defineConfig");
  });
});
