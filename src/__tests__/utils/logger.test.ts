import { describe, expect, it } from "bun:test";
import { info, success, successBox, warn } from "../../utils/logger";

describe("logger utilities", () => {
  it("formats status messages", () => {
    expect(info("hello")).toContain("hello");
    expect(success("done")).toContain("done");
    expect(warn("careful")).toContain("careful");
  });

  it("prints Docker next steps only when Docker is selected", () => {
    expect(successBox("sample-app", true)).toContain("docker compose up -d");
    expect(successBox("sample-app", false)).not.toContain("docker compose up -d");
  });
});
