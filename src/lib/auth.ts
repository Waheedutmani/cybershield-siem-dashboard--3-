import { createHash, randomBytes } from 'crypto';

export function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'cybershield_salt_2024').digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  token: string;
}

export interface AuthSession {
  user: SessionUser;
  expires: number;
}

const sessions = new Map<string, AuthSession>();

export function createSession(user: { id: string; email: string; name: string; role: string }): { token: string; session: AuthSession } {
  const token = generateSessionToken();
  const session: AuthSession = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      token,
    },
    expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  sessions.set(token, session);
  return { token, session };
}

export function getSession(token: string): AuthSession | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expires) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function destroySession(token: string): void {
  sessions.delete(token);
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/['"]/g, '')
    .replace(/[;&|`$(){}[\]]/g, '')
    .trim()
    .slice(0, 500);
}
