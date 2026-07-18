import type { Request, Response } from "express";
import * as historyService from "../services/historyService";
import { sendSuccess } from "../utils/response";

/** Handles paginated history listing. */
export async function listHistory(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await historyService.listHistory(req.user!.id, Number(req.query.page), Number(req.query.limit)));
}

/** Handles clearing request history. */
export async function clearHistory(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await historyService.clearHistory(req.user!.id));
}

/** Handles deleting one history entry. */
export async function deleteHistory(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await historyService.deleteHistory(req.user!.id, Number(req.params.id)));
}
