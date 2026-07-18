import { z } from "zod";

export const directSchema = z.object({ userId: z.number().int().positive() });
export const groupSchema = z.object({ name: z.string().min(1).max(100), memberIds: z.array(z.number().int().positive()).min(1) });
export const groupUpdateSchema = z.object({ name: z.string().min(1).max(100).optional(), avatar_url: z.string().url().optional().nullable() });
export const memberSchema = z.object({ userId: z.number().int().positive() });
export const messageSchema = z.object({ content: z.string().min(1).max(4000) });
export const reactionSchema = z.object({ emoji: z.string().min(1).max(10) });
export const readSchema = z.object({ messageId: z.number().int().positive() });

