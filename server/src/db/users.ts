import * as bcrypt from "bcryptjs";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
/*
  We define the roles that can exist in the system.
*/
export type UserRole = "admin" | "user";
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

/*
  This is where users are stored.
  IMPORTANT:
  Your project currently has server/schema/users.json,
  so this path should match that.
*/
const DATA_FILE = join(process.cwd(), "schema", "users.json");

function ensureDataDir() {
  const dir = join(process.cwd(), "schema");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function loadUsers(): User[] {
  ensureDataDir();
  if (!existsSync(DATA_FILE)) return [];
  try {
    const raw = readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveUsers(users: User[]) {
  ensureDataDir();
  writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), "utf-8");
}

const SALT_ROUNDS = 10;

function validateStrongPassword(password: string): string | null {
  if (password.length < 8) {
    return "Password skal være mindst 8 tegn.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password skal indeholde små bogstaver.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password skal indeholde store bogstaver.";
  }

  if (!/\d/.test(password)) {
    return "Password skal indeholde tal.";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password skal indeholde specialtegn.";
  }

  return null;
}

export function findByEmail(email: string): User | undefined {
  const users = loadUsers();
  const normalised = email.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === normalised);
}

export function findById(id: string): User | undefined {
  return loadUsers().find((u) => u.id === id);
}

export type PublicUser = Omit<User, "passwordHash">;

export async function createUser(
  email: string,
  password: string,
): Promise<{ user: PublicUser | null; error?: string }> {
  const normalised = email.trim().toLowerCase();

  if (!normalised || !password) {
    return {
      user: null,
      error: "Email og password er påkrævet.",
    };
  }

  const passwordError = validateStrongPassword(password);

  if (passwordError) {
    return {
      user: null,
      error: passwordError,
    };
  }

  if (findByEmail(normalised)) {
    return { user: null, error: "En bruger med denne email findes allerede." };
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  /*
    New users automatically get role "user".
    Admins can later be created manually or through a separate admin flow.
  */
  const user: User = {
    id: randomUUID(),
    email: normalised,
    passwordHash,
    role: "user",
    createdAt: new Date().toISOString(),
  };

  const users = loadUsers();
  users.push(user);
  saveUsers(users);

  const { passwordHash: _, ...publicUser } = user;
  return { user: publicUser };
}

export async function verifyLogin(
  email: string,
  password: string,
): Promise<{ user: PublicUser | null; token?: string; error?: string }> {
  const normalised = email.trim().toLowerCase();
  const user = findByEmail(normalised);

  if (!user) {
    return { user: null, error: "Ugyldig email eller password." };
  }

  const ok = await bcrypt.compare(password, user.passwordHash);

  if (!ok) {
    return { user: null, error: "Ugyldig email eller password." };
  }

  const token = randomUUID();
  setToken(token, user.id);

  const { passwordHash: _, ...publicUser } = user;
  return { user: publicUser, token };
}

const tokenToUserId = new Map<string, string>();

export function setToken(token: string, userId: string) {
  tokenToUserId.set(token, userId);
}

export function getUserIdFromToken(token: string): string | undefined {
  return tokenToUserId.get(token);
}