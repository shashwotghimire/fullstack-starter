import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { ScaffoldOptions } from "../types";

export function baseOptions(overrides: Partial<ScaffoldOptions> = {}): ScaffoldOptions {
  return {
    projectName: "test-app",
    targetDir: join(tmpdir(), "create-pern-app-test-app"),
    orm: "prisma",
    auth: "none",
    docker: true,
    databaseSetup: { mode: "skip" },
    lint: true,
    git: false,
    skipInstall: true,
    ...overrides,
  };
}

export async function tempProjectDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "create-pern-app-"));
}

export async function cleanup(path: string): Promise<void> {
  await rm(path, { recursive: true, force: true });
}

export async function read(path: string): Promise<string> {
  return readFile(path, "utf8");
}
