import type { FileEntry, ScaffoldOptions } from "../types";

function jwtService(options: ScaffoldOptions): string {
  if (options.orm === "prisma") {
    return `import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { getEnv } from "../utils/env";
import type { LoginInput, RegisterInput } from "../validators/authValidator";

type AuthResult = { token: string; user: { id: string; email: string; name: string } };

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, getEnv("JWT_SECRET"), {
    expiresIn: getEnv("JWT_EXPIRES_IN", "15m"),
  } as jwt.SignOptions);
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await db.user.create({
    data: { email: input.email, name: input.name, passwordHash },
  });
  return { token: signToken(user.id), user: { id: user.id, email: user.email, name: user.name } };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await db.user.findUnique({ where: { email: input.email } });
  const validPassword = user ? await bcrypt.compare(input.password, user.passwordHash) : false;
  if (!user || !validPassword) {
    throw new Error("Invalid email or password");
  }
  return { token: signToken(user.id), user: { id: user.id, email: user.email, name: user.name } };
}
`;
  }

  if (options.orm === "sequelize") {
    return `import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../db";
import { getEnv } from "../utils/env";
import type { LoginInput, RegisterInput } from "../validators/authValidator";

type AuthResult = { token: string; user: { id: string; email: string; name: string } };

function publicUser(user: User): AuthResult["user"] {
  return { id: user.id, email: user.email, name: user.name };
}

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, getEnv("JWT_SECRET"), {
    expiresIn: getEnv("JWT_EXPIRES_IN", "15m"),
  } as jwt.SignOptions);
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await User.create({ email: input.email, name: input.name, passwordHash });
  return { token: signToken(user.id), user: publicUser(user) };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await User.findOne({ where: { email: input.email } });
  const validPassword = user ? await bcrypt.compare(input.password, user.passwordHash) : false;
  if (!user || !validPassword) {
    throw new Error("Invalid email or password");
  }
  return { token: signToken(user.id), user: publicUser(user) };
}
`;
  }

  return `import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users } from "../db/schema";
import { getEnv } from "../utils/env";
import type { LoginInput, RegisterInput } from "../validators/authValidator";

type UserRow = typeof users.$inferSelect;
type AuthResult = { token: string; user: { id: string; email: string; name: string } };

function publicUser(user: UserRow): AuthResult["user"] {
  return { id: user.id, email: user.email, name: user.name };
}

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, getEnv("JWT_SECRET"), {
    expiresIn: getEnv("JWT_EXPIRES_IN", "15m"),
  } as jwt.SignOptions);
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const [user] = await db
    .insert(users)
    .values({ email: input.email, name: input.name, passwordHash })
    .returning();
  return { token: signToken(user.id), user: publicUser(user) };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
  const validPassword = user ? await bcrypt.compare(input.password, user.passwordHash) : false;
  if (!user || !validPassword) {
    throw new Error("Invalid email or password");
  }
  return { token: signToken(user.id), user: publicUser(user) };
}
`;
}

function jwtFiles(options: ScaffoldOptions): FileEntry[] {
  return [
    {
      path: "server/src/validators/authValidator.ts",
      contents: `import * as z from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
`,
    },
    {
      path: "server/src/middleware/auth.ts",
      contents: `import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getEnv } from "../utils/env";

export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) {
    res.status(401);
    next(new Error("Missing bearer token"));
    return;
  }
  jwt.verify(token, getEnv("JWT_SECRET"));
  next();
}
`,
    },
    {
      path: "server/src/services/authService.ts",
      contents: jwtService(options),
    },
    {
      path: "server/src/controllers/authController.ts",
      contents: `import type { Request, Response } from "express";
import { loginUser, registerUser } from "../services/authService";
import { httpStatus } from "../constants";
import { sendSuccess } from "../utils/response";
import { loginSchema, registerSchema } from "../validators/authValidator";

export async function register(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body);
  sendSuccess(res, await registerUser(input), httpStatus.created);
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  sendSuccess(res, await loginUser(input));
}
`,
    },
    {
      path: "server/src/routes/auth.ts",
      contents: `import { Router } from "express";
import { login, register } from "../controllers/authController";

const router = Router();

router.post("/register", register);
router.post("/login", login);

export default router;
`,
    },
  ];
}

function sessionFiles(): FileEntry[] {
  return [
    {
      path: "server/src/middleware/session.ts",
      contents: `import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import { getEnv, getNodeEnv } from "../utils/env";

const PgSession = connectPgSimple(session);

export const sessionMiddleware = session({
  store: new PgSession({ conString: getEnv("DATABASE_URL") }),
  secret: getEnv("SESSION_SECRET"),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: getNodeEnv() === "production",
  },
});
`,
    },
  ];
}

export function generateAuthFiles(options: ScaffoldOptions): FileEntry[] {
  if (options.auth === "jwt") {
    return jwtFiles(options);
  }

  if (options.auth === "session") {
    return sessionFiles();
  }

  return [];
}
