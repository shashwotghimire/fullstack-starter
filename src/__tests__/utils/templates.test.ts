import { describe, expect, it } from "bun:test";
import { readTemplate } from "../../utils/templates";

describe("template utilities", () => {
  it("reads static templates from src/templates", () => {
    expect(readTemplate("base/client/vite.config.ts")).toContain("defineConfig");
    expect(readTemplate("base/client/src/lib/axios.ts")).toContain("axios.create");
    expect(readTemplate("base/client/src/App.tsx")).toContain("react-router-dom");
    expect(readTemplate("base/server/src/routes/health.ts")).toContain("getHealth");
    expect(readTemplate("base/server/src/__tests__/health.test.ts")).toContain("/api/health");
  });
});
