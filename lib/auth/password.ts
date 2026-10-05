import "server-only";
import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

export async function verifyPassword(password: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash) {
    // Temps constant approximatif pour ne pas révéler l'existence du compte.
    await bcrypt.compare(password, "$2a$12$CwTycUXWue0Thq9StjUM0uJ8m3sCj7jhw0Jp6o/Zx6ZrUrbWzQ4Wm");
    return false;
  }
  return bcrypt.compare(password, hash);
}
