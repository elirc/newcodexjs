import type { Request, Response } from "express";
import * as proxyService from "../services/proxyService";
import { sendSuccess } from "../utils/response";

/** Handles backend-proxied HTTP execution for the request builder. */
export async function sendProxyRequest(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await proxyService.sendProxyRequest(req.user!.id, req.body));
}
