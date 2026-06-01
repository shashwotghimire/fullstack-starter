import { cancel, confirm, intro, isCancel, outro, select, text } from "@clack/prompts";
import { join } from "node:path";
import { scaffoldProject } from "./scaffold";
import type { AuthChoice, DatabaseSetup, OrmChoice, ScaffoldOptions } from "./types";
import { successBox, warn } from "./utils/logger";

const defaultProjectName = "my-pern-app";

type ParsedArgs = {
  projectName?: string;
  skipInstall: boolean;
  help: boolean;
};

export function parseArgs(args: string[]): ParsedArgs {
  const help = args.includes("--help") || args.includes("-h");
  const skipInstall = args.includes("--skip-install");
  const projectName = args.find((arg) => !arg.startsWith("-"));

  return { projectName, skipInstall, help };
}

function usage(): string {
  return [
    "create-pern-app",
    "",
    "Usage:",
    "  create-pern-app [project-name] [--skip-install]",
    "",
    "Options:",
    "  --skip-install  Generate files without installing dependencies",
    "  -h, --help      Show this help message",
  ].join("\n");
}

export function shouldIncludeDockerStart(docker: boolean, databaseSetup: DatabaseSetup): boolean {
  return docker && databaseSetup.mode !== "docker";
}

function assertNotCanceled<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel("Scaffold canceled.");
    process.exit(0);
  }

  return value;
}

function isValidProjectName(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

async function promptProjectName(arg?: string): Promise<string> {
  if (arg && isValidProjectName(arg)) {
    return arg;
  }

  const value = assertNotCanceled(
    await text({
      message: "What is your project named?",
      placeholder: defaultProjectName,
      defaultValue: defaultProjectName,
      validate(input) {
        return isValidProjectName(input) ? undefined : "Use lowercase kebab-case.";
      },
    }),
  );

  return value;
}

async function promptDatabaseSetup(docker: boolean): Promise<DatabaseSetup> {
  const runNow = assertNotCanceled(
    await confirm({
      message: docker
        ? "Start Postgres with Docker and run the initial migration now?"
        : "Run the initial migration against an existing Postgres database now?",
      initialValue: false,
    }),
  );

  if (!runNow) {
    return { mode: "skip" };
  }

  if (docker) {
    return { mode: "docker" };
  }

  const connectionString = assertNotCanceled(
    await text({
      message: "PostgreSQL connection string",
      placeholder: "postgresql://postgres:postgres@localhost:5432/my_pern_app",
    }),
  );

  return connectionString.trim()
    ? { mode: "connection-string", connectionString }
    : { mode: "skip" };
}

export async function runCLI(args: string[]): Promise<void> {
  const parsedArgs = parseArgs(args);

  if (parsedArgs.help) {
    console.log(usage());
    return;
  }

  intro("create-pern-app");

  const projectName = await promptProjectName(parsedArgs.projectName);
  const orm = assertNotCanceled(
    await select<OrmChoice>({
      message: "Choose an ORM",
      options: [
        { value: "prisma", label: "Prisma", hint: "schema-first, great DX" },
        { value: "drizzle", label: "Drizzle ORM", hint: "lightweight and SQL-like" },
      ],
    }),
  );
  const auth = assertNotCanceled(
    await select<AuthChoice>({
      message: "Authentication",
      options: [
        { value: "none", label: "None" },
        { value: "jwt", label: "JWT" },
        { value: "session", label: "Session" },
      ],
    }),
  );
  const docker = assertNotCanceled(
    await confirm({ message: "Generate Docker Compose?", initialValue: true }),
  );
  const databaseSetup = await promptDatabaseSetup(docker);
  const lint = assertNotCanceled(
    await confirm({ message: "Generate ESLint + Prettier config?", initialValue: true }),
  );
  const git = assertNotCanceled(await confirm({ message: "Initialize git?", initialValue: true }));

  const options: ScaffoldOptions = {
    projectName,
    targetDir: join(process.cwd(), projectName),
    orm,
    auth,
    docker,
    databaseSetup,
    lint,
    git,
    skipInstall: parsedArgs.skipInstall,
  };

  const result = await scaffoldProject(options);
  if (result.dbSetupError) {
    console.warn(warn("Database setup failed. Files were left intact and git init was skipped."));
    console.warn(warn("Recovery: start Postgres, then run cd server && bun run db:migrate."));
  }
  outro(
    successBox(projectName, {
      includeDockerStart: shouldIncludeDockerStart(docker, databaseSetup),
    }),
  );
}
