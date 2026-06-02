import { basename, join } from "node:path";
import { generateAuthFiles } from "./generators/auth";
import { generateBaseFiles } from "./generators/base";
import { generateDockerFiles } from "./generators/docker";
import { generateOrmFiles } from "./generators/orm";
import type { OrmChoice, ScaffoldOptions, TemplateTokens } from "./types";
import { ensureDir, writeFiles } from "./utils/files";
import { initGit, runDbSetup, runInstall, startDockerCompose } from "./utils/pkgManager";

export type ScaffoldResult = {
  dbSetupSucceeded: boolean;
  dbSetupError?: Error;
};

function dbName(projectName: string): string {
  return projectName.replaceAll("-", "_");
}

function tokens(options: ScaffoldOptions): TemplateTokens {
  return {
    PROJECT_NAME: basename(options.projectName),
    DB_NAME: dbName(options.projectName),
  };
}

export function getDbSetupScripts(orm: OrmChoice): string[] {
  if (orm === "drizzle") {
    return ["db:generate", "db:migrate"];
  }

  if (orm === "sequelize") {
    return ["db:migrate"];
  }

  return ["db:migrate:init"];
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export async function scaffoldProject(options: ScaffoldOptions): Promise<ScaffoldResult> {
  const projectTokens = tokens(options);
  const result: ScaffoldResult = { dbSetupSucceeded: options.databaseSetup.mode === "skip" };
  await ensureDir(options.targetDir);

  const files = [
    ...generateBaseFiles(options),
    ...generateOrmFiles(options),
    ...generateAuthFiles(options),
    ...generateDockerFiles(options),
  ];

  await writeFiles(options.targetDir, files, projectTokens);

  if (!options.skipInstall) {
    await runInstall(join(options.targetDir, "server"));
    await runInstall(join(options.targetDir, "client"));
  }

  if (!options.skipInstall && options.databaseSetup.mode !== "skip") {
    try {
      if (options.databaseSetup.mode === "docker") {
        await startDockerCompose(options.targetDir);
      }

      await runDbSetup(join(options.targetDir, "server"), getDbSetupScripts(options.orm));
      result.dbSetupSucceeded = true;
    } catch (error) {
      result.dbSetupError = normalizeError(error);
    }
  }

  if (options.git && !options.skipInstall && !result.dbSetupError) {
    await initGit(options.targetDir);
  }

  return result;
}
