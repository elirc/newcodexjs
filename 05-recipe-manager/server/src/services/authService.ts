import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { env } from '../config/env.js';
import {
  createRefreshToken,
  createUser,
  deleteExpiredRefreshTokens,
  deleteRefreshToken,
  findPublicUserById,
  findUserByEmail,
  listRefreshTokensForUser
} from '../models/userModel.js';
import { UnauthorizedError, ValidationError } from '../utils/errors.js';

type AuthResult = { user: unknown; accessToken: string; refreshToken: string };

/** Signs a short-lived access token for API authorization. */
function signAccessToken(user: { id: number; username: string; email: string }): string {
  return jwt.sign(user, env.jwtAccessSecret, { expiresIn: '15m' });
}

/** Signs a long-lived refresh token stored only as a hash server-side. */
function signRefreshToken(userId: number): string {
  return jwt.sign({ id: userId }, env.jwtRefreshSecret, { expiresIn: '7d' });
}

/** Persists a refresh token hash for later verification and invalidation. */
async function persistRefreshToken(userId: number, refreshToken: string): Promise<void> {
  const tokenHash = await bcrypt.hash(refreshToken, 10);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await createRefreshToken(db, userId, tokenHash, expiresAt);
}

/** Registers a user and returns tokens for an authenticated first session. */
export async function register(input: { username: string; email: string; password: string; displayName?: string }): Promise<AuthResult> {
  if (input.password.length < 8) throw new ValidationError('Password must be at least 8 characters');
  const duplicate = await findUserByEmail(input.email);
  if (duplicate) throw new ValidationError('Email is already registered');
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await createUser({ ...input, passwordHash });
  const accessToken = signAccessToken({ id: user.id, username: user.username, email: user.email });
  const refreshToken = signRefreshToken(user.id);
  await persistRefreshToken(user.id, refreshToken);
  return { user, accessToken, refreshToken };
}

/** Validates credentials and starts a new authenticated session. */
export async function login(input: { email: string; password: string }): Promise<AuthResult> {
  await deleteExpiredRefreshTokens();
  const user = await findUserByEmail(input.email);
  if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
    throw new UnauthorizedError('Invalid email or password');
  }
  const publicUser = await findPublicUserById(user.id);
  const accessToken = signAccessToken({ id: user.id, username: user.username, email: user.email });
  const refreshToken = signRefreshToken(user.id);
  await persistRefreshToken(user.id, refreshToken);
  return { user: publicUser, accessToken, refreshToken };
}

/** Exchanges a valid refresh cookie for a new access token. */
export async function refresh(refreshToken: string): Promise<{ user: unknown; accessToken: string }> {
  const payload = jwt.verify(refreshToken, env.jwtRefreshSecret) as { id: number };
  const tokens = await listRefreshTokensForUser(payload.id);
  const matched = await Promise.all(tokens.map(async (token) => ((await bcrypt.compare(refreshToken, token.token_hash)) ? token : undefined)));
  const stored = matched.find(Boolean);
  if (!stored) throw new UnauthorizedError('Refresh token has been revoked');
  const user = await findPublicUserById(payload.id);
  if (!user) throw new UnauthorizedError('User no longer exists');
  return { user, accessToken: signAccessToken({ id: user.id, username: user.username, email: user.email }) };
}

/** Invalidates the current refresh cookie when present. */
export async function logout(refreshToken?: string): Promise<void> {
  if (!refreshToken) return;
  const payload = jwt.verify(refreshToken, env.jwtRefreshSecret) as { id: number };
  const tokens = await listRefreshTokensForUser(payload.id);
  for (const token of tokens) {
    if (await bcrypt.compare(refreshToken, token.token_hash)) await deleteRefreshToken(token.id);
  }
}
