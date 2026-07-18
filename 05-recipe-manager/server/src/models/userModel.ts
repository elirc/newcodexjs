import type { Knex } from 'knex';
import { db } from '../config/db.js';
import type { User } from '../types/domain.js';

const publicColumns = ['id', 'username', 'email', 'display_name', 'avatar_url', 'created_at'];

/** Finds a user by email for login and duplicate checks. */
export async function findUserByEmail(email: string): Promise<User | undefined> {
  return db<User>('users').where({ email: email.toLowerCase() }).first();
}

/** Finds a user by id and returns only public-safe profile fields. */
export async function findPublicUserById(id: number): Promise<Omit<User, 'password_hash'> | undefined> {
  return db('users').select(publicColumns).where({ id }).first();
}

/** Inserts a new user and returns the created public profile. */
export async function createUser(input: {
  username: string;
  email: string;
  passwordHash: string;
  displayName?: string;
}): Promise<Omit<User, 'password_hash'>> {
  const [user] = await db('users')
    .insert({
      username: input.username,
      email: input.email.toLowerCase(),
      password_hash: input.passwordHash,
      display_name: input.displayName ?? input.username
    })
    .returning(publicColumns);
  return user;
}

/** Stores a hashed refresh token so logout can invalidate it server-side. */
export async function createRefreshToken(
  trx: Knex | typeof db,
  userId: number,
  tokenHash: string,
  expiresAt: Date
): Promise<void> {
  await trx('refresh_tokens').insert({ user_id: userId, token_hash: tokenHash, expires_at: expiresAt });
}

/** Lists active refresh token hashes for a user so the service can compare securely. */
export async function listRefreshTokensForUser(userId: number): Promise<Array<{ id: number; token_hash: string }>> {
  return db('refresh_tokens').where('user_id', userId).andWhere('expires_at', '>', db.fn.now()).select('id', 'token_hash');
}

/** Deletes a refresh token after successful logout or rotation. */
export async function deleteRefreshToken(id: number): Promise<void> {
  await db('refresh_tokens').where({ id }).delete();
}

/** Deletes expired refresh tokens as lightweight cleanup during auth flows. */
export async function deleteExpiredRefreshTokens(): Promise<void> {
  await db('refresh_tokens').where('expires_at', '<=', db.fn.now()).delete();
}
