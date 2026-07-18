import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../utils/errors.js';

type AccessPayload = { id: number; username: string; email: string };

/** Extracts a bearer token from Authorization or falls back to an access cookie for local demos. */
function getToken(req: Request): string | undefined {
  const header = req.header('authorization');
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length);
  return req.cookies?.access_token;
}

/** Requires a valid access token and attaches the authenticated user to the request. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = getToken(req);
  if (!token) throw new UnauthorizedError();
  try {
    req.user = jwt.verify(token, env.jwtAccessSecret) as AccessPayload;
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

/** Attaches a user when a valid token is present without blocking public routes. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = getToken(req);
  if (!token) return next();
  try {
    req.user = jwt.verify(token, env.jwtAccessSecret) as AccessPayload;
  } catch {
    req.user = undefined;
  }
  next();
}
