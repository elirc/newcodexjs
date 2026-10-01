import type { Request, Response } from "express";
import * as service from "../services/service.js";
import { sendSuccess } from "../utils/response.js";

/** Handles list requests. */
export async function list(req: Request, res: Response) { return sendSuccess(res, await service.list(req.query as { search?: string; status?: string })); }
/** Handles detail requests. */
export async function get(req: Request, res: Response) { return sendSuccess(res, await service.get(req.params.id)); }
/** Handles create requests. */
export async function create(req: Request, res: Response) { return sendSuccess(res, await service.create(req.body), 201); }
/** Handles update requests. */
export async function update(req: Request, res: Response) { return sendSuccess(res, await service.update(req.params.id, req.body)); }
/** Handles delete requests. */
export async function remove(req: Request, res: Response) { return sendSuccess(res, await service.remove(req.params.id)); }
/** Handles stats requests. */
export async function stats(req: Request, res: Response) { return sendSuccess(res, await service.getStats()); }

/** Explicit metadata preview; it never saves or changes a bookmark. */
export async function metadata(req: Request, res: Response) { return sendSuccess(res, await service.metadata(req.body)); }
