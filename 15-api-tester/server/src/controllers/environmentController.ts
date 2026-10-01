import type { Request, Response } from "express";
import * as environmentService from "../services/environmentService.js";
import { sendSuccess } from "../utils/response.js";

/** Handles environment listing. */
export async function listEnvironments(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(res, await environmentService.listEnvironments(req.user!.id));
}

/** Handles environment creation. */
export async function createEnvironment(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(
    res,
    await environmentService.createEnvironment(req.user!.id, req.body),
    201,
  );
}

/** Handles environment update. */
export async function updateEnvironment(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(
    res,
    await environmentService.updateEnvironment(
      req.user!.id,
      Number(String(req.params.id)),
      req.body,
    ),
  );
}

/** Handles environment deletion. */
export async function deleteEnvironment(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(
    res,
    await environmentService.deleteEnvironment(
      req.user!.id,
      Number(String(req.params.id)),
    ),
  );
}

/** Handles activating one environment. */
export async function activateEnvironment(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(
    res,
    await environmentService.activateEnvironment(
      req.user!.id,
      Number(String(req.params.id)),
    ),
  );
}

/** Handles variable listing. */
export async function getVariables(req: Request, res: Response): Promise<void> {
  sendSuccess(
    res,
    await environmentService.getVariables(
      req.user!.id,
      Number(String(req.params.id)),
    ),
  );
}

/** Handles bulk variable replacement. */
export async function replaceVariables(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(
    res,
    await environmentService.replaceVariables(
      req.user!.id,
      Number(String(req.params.id)),
      req.body,
    ),
  );
}
