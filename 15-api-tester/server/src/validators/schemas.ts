import { z } from "zod";

export const idParamsSchema = z.object({ id: z.coerce.number().int().positive() });
export const collectionFolderParamsSchema = z.object({ collectionId: z.coerce.number().int().positive() });

const pairSchema = z.object({
  key: z.string(),
  value: z.string(),
  enabled: z.boolean().optional()
});

export const proxyBodySchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]),
  url: z.string().min(1),
  params: z.array(pairSchema).optional(),
  headers: z.array(pairSchema).optional(),
  body: z.string().optional(),
  environmentId: z.number().int().positive().optional(),
  auth: z
    .object({
      type: z.enum(["none", "bearer", "basic"]),
      token: z.string().optional(),
      username: z.string().optional(),
      password: z.string().optional()
    })
    .optional()
});

export const collectionBodySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  sort_order: z.number().int().optional()
});

export const folderBodySchema = z.object({
  name: z.string().min(1).max(100),
  sort_order: z.number().int().optional()
});

export const requestBodySchema = z.object({
  collection_id: z.number().int().positive().nullable().optional(),
  folder_id: z.number().int().positive().nullable().optional(),
  name: z.string().min(1).max(200),
  method: z.string().max(10),
  url: z.string().min(1),
  headers: z.array(pairSchema).default([]),
  params: z.array(pairSchema).default([]),
  body_type: z.enum(["json", "form-data", "raw", "none"]).nullable().optional(),
  body_content: z.string().nullable().optional(),
  auth_type: z.enum(["none", "bearer", "basic"]).nullable().optional(),
  auth_config: z.record(z.unknown()).nullable().optional(),
  sort_order: z.number().int().optional()
});

export const importBodySchema = z.object({
  requests: z.array(requestBodySchema.partial({ collection_id: true, folder_id: true })).default([])
});

export const environmentBodySchema = z.object({
  name: z.string().min(1).max(100),
  is_active: z.boolean().optional()
});

export const variablesBodySchema = z.array(
  z.object({
    key: z.string().min(1).max(100),
    value: z.string(),
    is_secret: z.boolean().optional(),
    sort_order: z.number().int().optional()
  })
);

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(30)
});
