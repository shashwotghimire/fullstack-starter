export type OrmChoice = "prisma" | "drizzle" | "sequelize";

export type AuthChoice = "none" | "jwt" | "session";

export type DatabaseSetup =
  | { mode: "skip" }
  | { mode: "docker" }
  | { mode: "connection-string"; connectionString: string };

export type ScaffoldOptions = {
  projectName: string;
  targetDir: string;
  orm: OrmChoice;
  auth: AuthChoice;
  docker: boolean;
  databaseSetup: DatabaseSetup;
  lint: boolean;
  git: boolean;
  skipInstall: boolean;
};

export type TemplateTokens = {
  PROJECT_NAME: string;
  DB_NAME: string;
};

export type FileEntry = {
  path: string;
  contents: string;
};
