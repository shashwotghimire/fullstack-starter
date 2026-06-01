import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { FileEntry, TemplateTokens } from "../types";

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
  await Bun.write(path, contents);
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
