import { describe, expect, it } from "bun:test";
import { parseArgs } from "../cli";

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
});
