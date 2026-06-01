import { describe, expect, it } from "bun:test";
import { generateDockerFiles } from "../../generators/docker";
import { baseOptions } from "../testUtils";

describe("generateDockerFiles", () => {
  it("writes docker-compose when Docker is selected", () => {
    const files = generateDockerFiles(baseOptions({ docker: true }));

    expect(files).toHaveLength(1);
    expect(files[0]?.path).toBe("docker-compose.yml");
    expect(files[0]?.contents).toContain("postgres:16");
  });

  it("does not write docker-compose when Docker is skipped", () => {
    expect(generateDockerFiles(baseOptions({ docker: false }))).toEqual([]);
  });
});
