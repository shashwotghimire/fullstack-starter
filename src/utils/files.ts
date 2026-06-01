import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { FileEntry, TemplateTokens } from "../types";

type BunLike = {
  argv: string[];
  write(path: string, contents: string): Promise<unknown>;
};

function getBun(): BunLike | undefined {
  return typeof Bun === "undefined" ? undefined : Bun;
}

export function getRuntimeArgv(
  bunArgv?: string[],
  nodeArgv?: string[],
): string[] {
  return (bunArgv ?? nodeArgv ?? getBun()?.argv ?? process.argv).slice(2);
}

export function renderTemplate(contents: string, tokens: TemplateTokens): string {
  return Object.entries(tokens).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
    contents,
  );
}

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

export async function writeTextFile(path: string, contents: string): Promise<void> {
  await ensureDir(dirname(path));
  const bun = getBun();
  if (bun) {
    await bun.write(path, contents);
    return;
  }

  await writeFile(path, contents, "utf8");
}

export async function writeFiles(
  rootDir: string,
  files: FileEntry[],
  tokens: TemplateTokens,
): Promise<void> {
  await Promise.all(
    files.map((file) =>
      writeTextFile(join(rootDir, file.path), renderTemplate(file.contents, tokens)),
    ),
  );
}
