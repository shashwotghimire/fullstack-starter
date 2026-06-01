import { describe, expect, it } from "bun:test";
import { parseArgs, shouldIncludeDockerStart } from "../cli";

describe("parseArgs", () => {
  it("parses project name, install, and help flags", () => {
    expect(parseArgs(["sample-app", "--skip-install"])).toEqual({
      projectName: "sample-app",
      skipInstall: true,
      help: false,
    });
    expect(parseArgs(["--help"])).toEqual({
      projectName: undefined,
      skipInstall: false,
      help: true,
    });
  });

  it("only includes Docker start next steps when Docker has not already started", () => {
    expect(shouldIncludeDockerStart(true, { mode: "skip" })).toBe(true);
    expect(
      shouldIncludeDockerStart(true, { mode: "connection-string", connectionString: "url" }),
    ).toBe(true);
    expect(shouldIncludeDockerStart(true, { mode: "docker" })).toBe(false);
    expect(shouldIncludeDockerStart(false, { mode: "skip" })).toBe(false);
  });
});
