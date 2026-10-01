import type { Request, Response } from "express";
import * as collectionService from "../services/collectionService.js";
import { sendSuccess } from "../utils/response.js";

/** Handles collection tree listing. */
export async function listCollections(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(res, await collectionService.listCollections(req.user!.id));
}

/** Handles collection creation. */
export async function createCollection(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(
    res,
    await collectionService.createCollection(req.user!.id, req.body),
    201,
  );
}

/** Handles collection update. */
export async function updateCollection(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(
    res,
    await collectionService.updateCollection(
      req.user!.id,
      Number(String(req.params.id)),
      req.body,
    ),
  );
}

/** Handles collection deletion. */
export async function deleteCollection(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(
    res,
    await collectionService.deleteCollection(
      req.user!.id,
      Number(String(req.params.id)),
    ),
  );
}

/** Handles collection import. */
export async function importCollection(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(
    res,
    await collectionService.importCollection(
      req.user!.id,
      Number(String(req.params.id)),
      req.body,
    ),
    201,
  );
}

/** Handles collection export. */
export async function exportCollection(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(
    res,
    await collectionService.exportCollection(
      req.user!.id,
      Number(String(req.params.id)),
    ),
  );
}

/** Handles folder creation. */
export async function createFolder(req: Request, res: Response): Promise<void> {
  sendSuccess(
    res,
    await collectionService.createFolder(
      Number(req.params.collectionId),
      req.body,
    ),
    201,
  );
}

/** Handles folder update. */
export async function updateFolder(req: Request, res: Response): Promise<void> {
  sendSuccess(
    res,
    await collectionService.updateFolder(
      Number(String(req.params.id)),
      req.body,
    ),
  );
}

/** Handles folder deletion. */
export async function deleteFolder(req: Request, res: Response): Promise<void> {
  sendSuccess(
    res,
    await collectionService.deleteFolder(Number(String(req.params.id))),
  );
}

/** Handles saved request lookup. */
export async function getRequest(req: Request, res: Response): Promise<void> {
  sendSuccess(
    res,
    await collectionService.getSavedRequest(
      req.user!.id,
      Number(String(req.params.id)),
    ),
  );
}

/** Handles saving a request. */
export async function saveRequest(req: Request, res: Response): Promise<void> {
  sendSuccess(
    res,
    await collectionService.saveRequest(req.user!.id, req.body),
    201,
  );
}

/** Handles saved request update. */
export async function updateRequest(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(
    res,
    await collectionService.updateRequest(
      req.user!.id,
      Number(String(req.params.id)),
      req.body,
    ),
  );
}

/** Handles saved request deletion. */
export async function deleteRequest(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(
    res,
    await collectionService.deleteRequest(
      req.user!.id,
      Number(String(req.params.id)),
    ),
  );
}

/** Handles saved request duplication. */
export async function duplicateRequest(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(
    res,
    await collectionService.duplicateRequest(
      req.user!.id,
      Number(String(req.params.id)),
    ),
    201,
  );
}
