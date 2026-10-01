import type { Request, Response } from "express";
import * as proxyService from "../services/proxyService.js";
import { sendSuccess } from "../utils/response.js";

/** Handles backend-proxied HTTP execution for the request builder. */
export async function sendProxyRequest(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(res, await proxyService.sendProxyRequest(req.user!.id, req.body));
}
