import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import * as authService from '../services/authService.js';
import { sendSuccess } from '../utils/response.js';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.nodeEnv === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

/** Registers a new user and stores the refresh token in an HTTP-only cookie. */
export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.register(req.body);
  res.cookie('refresh_token', result.refreshToken, cookieOptions);
  sendSuccess(res, { user: result.user, accessToken: result.accessToken }, 201);
}

/** Logs a user in and stores the refresh token in an HTTP-only cookie. */
export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body);
  res.cookie('refresh_token', result.refreshToken, cookieOptions);
  sendSuccess(res, { user: result.user, accessToken: result.accessToken });
}

/** Clears the refresh cookie and revokes its stored token hash. */
export async function logout(req: Request, res: Response): Promise<void> {
  await authService.logout(req.cookies?.refresh_token);
  res.clearCookie('refresh_token');
  sendSuccess(res, { loggedOut: true });
}

/** Refreshes the in-memory access token using the HTTP-only refresh cookie. */
export async function refresh(req: Request, res: Response): Promise<void> {
  const result = await authService.refresh(req.cookies?.refresh_token);
  sendSuccess(res, result);
}

/** Returns the authenticated user already attached by auth middleware. */
export async function me(req: Request, res: Response): Promise<void> {
  sendSuccess(res, { user: req.user });
}
