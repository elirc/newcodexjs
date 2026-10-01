import type { Request, Response } from "express";
import * as service from "../services/service.js";
import { sendSuccess } from "../utils/response.js";

/** Handles list requests. */
export async function list(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.list(req.query as { search?: string; status?: string }),
  );
}
/** Handles detail requests. */
export async function get(req: Request, res: Response) {
  return sendSuccess(res, await service.get(String(req.params.id)));
}
/** Handles create requests. */
export async function create(req: Request, res: Response) {
  return sendSuccess(res, await service.create(req.body), 201);
}
/** Handles update requests. */
export async function update(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.update(String(req.params.id), req.body),
  );
}
/** Handles delete requests. */
export async function remove(req: Request, res: Response) {
  return sendSuccess(res, await service.remove(String(req.params.id)));
}
/** Handles stats requests. */
export async function stats(req: Request, res: Response) {
  return sendSuccess(res, await service.getStats());
}
