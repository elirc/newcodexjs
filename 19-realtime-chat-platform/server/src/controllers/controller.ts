import type { Request, Response } from "express";
import * as service from "../services/service";
import { sendSuccess } from "../utils/response";

export async function list(req: Request, res: Response) {
  return sendSuccess(res, await service.list(req.query));
}

export async function dashboard(_req: Request, res: Response) {
  return sendSuccess(res, await service.dashboard());
}

export async function activity(_req: Request, res: Response) {
  return sendSuccess(res, await service.activity());
}

export async function audit(req: Request, res: Response) {
  return sendSuccess(res, await service.auditLog(req.query));
}

export async function views(req: Request, res: Response) {
  return sendSuccess(res, await service.listSavedViews(req.query));
}

export async function createView(req: Request, res: Response) {
  return sendSuccess(res, await service.createSavedView(req.body, req.requestContext), 201);
}

export async function bulkStatus(req: Request, res: Response) {
  return sendSuccess(res, await service.bulkStatus(req.body, req.requestContext));
}

export async function get(req: Request, res: Response) {
  return sendSuccess(res, await service.get(req.params.id));
}

export async function create(req: Request, res: Response) {
  return sendSuccess(res, await service.create(req.body, req.requestContext), 201);
}

export async function update(req: Request, res: Response) {
  return sendSuccess(res, await service.update(req.params.id, req.body, req.requestContext));
}

export async function archive(req: Request, res: Response) {
  return sendSuccess(res, await service.archive(req.params.id, req.requestContext));
}

export async function restore(req: Request, res: Response) {
  return sendSuccess(res, await service.restore(req.params.id, req.requestContext));
}

export async function remove(req: Request, res: Response) {
  return sendSuccess(res, await service.remove(req.params.id, req.requestContext));
}

export async function comments(req: Request, res: Response) {
  return sendSuccess(res, await service.listComments(req.params.id));
}

export async function addComment(req: Request, res: Response) {
  return sendSuccess(res, await service.addComment(req.params.id, req.body, req.requestContext), 201);
}
