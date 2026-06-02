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

export async function connectDb(): Promise<void> {
  await db.$connect();
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

export async function connectDb(): Promise<void> {
  await client\`select 1\`;
}
`,
    },
    { path: "server/src/db/migrations/.gitkeep", contents: "" },
  ];
}

function sequelizeFiles(): FileEntry[] {
  return [
    {
      path: "config/config.js",
      contents: `module.exports = {
  development: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/{{DB_NAME}}",
    dialect: "postgres",
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: "postgres",
  },
};
`,
    },
    {
      path: "sequelize/migrations/001-create-users.cjs",
      contents: `"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      password_hash: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("now()"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("now()"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("users");
  },
};
`,
    },
    {
      path: "server/src/db/models/user.ts",
      contents: `import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare email: string;
  declare name: string;
  declare passwordHash: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initUserModel(sequelize: Sequelize): void {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      passwordHash: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "password_hash",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "updated_at",
      },
    },
    {
      sequelize,
      tableName: "users",
      underscored: true,
      timestamps: true,
    },
  );
}
`,
    },
    {
      path: "server/src/db/index.ts",
      contents: `import { Sequelize } from "sequelize";
import { getEnv } from "../utils/env";
import { initUserModel, User } from "./models/user";

export const sequelize = new Sequelize(getEnv("DATABASE_URL"), {
  dialect: "postgres",
  logging: false,
});

initUserModel(sequelize);

export const db = sequelize;
export { User };

export async function connectDb(): Promise<void> {
  await sequelize.authenticate();
}
`,
    },
  ];
}

export function generateOrmFiles(options: ScaffoldOptions): FileEntry[] {
  if (options.orm === "prisma") {
    return prismaFiles();
  }

  if (options.orm === "sequelize") {
    return sequelizeFiles();
  }

  return drizzleFiles();
}
