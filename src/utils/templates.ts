import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const sourceDir = dirname(fileURLToPath(import.meta.url));

function templateRoots(): string[] {
  return [
    join(sourceDir, "..", "templates"),
    join(sourceDir, "..", "src", "templates"),
  ];
}

export function readTemplate(path: string): string {
  for (const root of templateRoots()) {
    const templatePath = join(root, path);
    if (existsSync(templatePath)) {
      return readFileSync(templatePath, "utf8");
    }
  }

  throw new Error(`Template not found: ${path}`);
}
