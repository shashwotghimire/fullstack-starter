import type { FileEntry, ScaffoldOptions } from "../types";

function prismaFiles(): FileEntry[] {
  return [
    {
      path: "prisma/schema.prisma",
      contents: `generator client {
  provider = "prisma-client"
  output   = "../server/src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email        String   @unique @db.VarChar(255)
  name         String   @db.VarChar(255)
  passwordHash String   @map("password_hash")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @default(now()) @updatedAt @map("updated_at")

  @@map("users")
}
`,
    },
    {
      path: "server/src/db/index.ts",
      contents: `import { getNodeEnv } from "../utils/env";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: InstanceType<typeof PrismaClient> };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (getNodeEnv() !== "production") {
  globalForPrisma.prisma = db;
}
`,
    },
  ];
}

function drizzleFiles(): FileEntry[] {
  return [
    {
      path: "drizzle.config.ts",
      contents: `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./server/src/db/schema.ts",
  out: "./server/src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/{{DB_NAME}}",
  },
});
`,
    },
    {
      path: "server/src/db/schema.ts",
      contents: `import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql\`gen_random_uuid()\`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
`,
    },
    {
      path: "server/src/db/index.ts",
      contents: `import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "../utils/env";
import * as schema from "./schema";

const client = postgres(getEnv("DATABASE_URL"));

export const db = drizzle(client, { schema });
`,
    },
    { path: "server/src/db/migrations/.gitkeep", contents: "" },
  ];
}

export function generateOrmFiles(options: ScaffoldOptions): FileEntry[] {
  return options.orm === "prisma" ? prismaFiles() : drizzleFiles();
}
