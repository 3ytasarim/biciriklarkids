import { hash, verify } from "@node-rs/argon2";

// OWASP önerisi (Argon2id, 19 MiB, t=2, p=1).
const ARGON2_OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

export const PASSWORD_MIN_LENGTH = 10;
