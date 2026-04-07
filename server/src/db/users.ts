import bcrypt from "bcryptjs";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

const DATA_FILE = join(process.cwd(), "data", "users.json");

function ensureDataDir() {
  const dir = join(process.cwd(), "data");
  if (!existsSync(dir)) {
    const fs = require("fs");
    fs.mkdirSync(dir, { recursive: true });
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
  if (!normalised || !password || password.length < 8) {
    return {
      user: null,
      error: "Email og password er påkrævet (password min. 8 tegn).",
    };
  }
  if (findByEmail(normalised)) {
    return { user: null, error: "En bruger med denne email findes allerede." };
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user: User = {
    id: crypto.randomUUID(),
    email: normalised,
    passwordHash,
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
  const token = crypto.randomUUID();
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
