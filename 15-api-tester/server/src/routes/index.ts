import type { RequestHandler } from "express";
import { Router } from "express";
import * as collectionController from "../controllers/collectionController.js";
import * as environmentController from "../controllers/environmentController.js";
import * as historyController from "../controllers/historyController.js";
import * as proxyController from "../controllers/proxyController.js";
import { validate } from "../middleware/validate.js";
import {
  collectionBodySchema,
  collectionFolderParamsSchema,
  environmentBodySchema,
  folderBodySchema,
  historyQuerySchema,
  idParamsSchema,
  importBodySchema,
  proxyBodySchema,
  requestBodySchema,
  variablesBodySchema,
} from "../validators/schemas.js";

export const apiRouter = Router();

apiRouter.post(
  "/proxy",
  validate({ body: proxyBodySchema }),
  wrap(proxyController.sendProxyRequest),
);
apiRouter.get("/collections", wrap(collectionController.listCollections));
apiRouter.post(
  "/collections",
  validate({ body: collectionBodySchema }),
  wrap(collectionController.createCollection),
);
apiRouter.put(
  "/collections/:id",
  validate({ params: idParamsSchema, body: collectionBodySchema.partial() }),
  wrap(collectionController.updateCollection),
);
apiRouter.delete(
  "/collections/:id",
  validate({ params: idParamsSchema }),
  wrap(collectionController.deleteCollection),
);
apiRouter.post(
  "/collections/:id/import",
  validate({ params: idParamsSchema, body: importBodySchema }),
  wrap(collectionController.importCollection),
);
apiRouter.get(
  "/collections/:id/export",
  validate({ params: idParamsSchema }),
  wrap(collectionController.exportCollection),
);
apiRouter.post(
  "/collections/:collectionId/folders",
  validate({ params: collectionFolderParamsSchema, body: folderBodySchema }),
  wrap(collectionController.createFolder),
);
apiRouter.put(
  "/folders/:id",
  validate({ params: idParamsSchema, body: folderBodySchema.partial() }),
  wrap(collectionController.updateFolder),
);
apiRouter.delete(
  "/folders/:id",
  validate({ params: idParamsSchema }),
  wrap(collectionController.deleteFolder),
);
apiRouter.get(
  "/requests/:id",
  validate({ params: idParamsSchema }),
  wrap(collectionController.getRequest),
);
apiRouter.post(
  "/requests",
  validate({ body: requestBodySchema }),
  wrap(collectionController.saveRequest),
);
apiRouter.put(
  "/requests/:id",
  validate({ params: idParamsSchema, body: requestBodySchema.partial() }),
  wrap(collectionController.updateRequest),
);
apiRouter.delete(
  "/requests/:id",
  validate({ params: idParamsSchema }),
  wrap(collectionController.deleteRequest),
);
apiRouter.post(
  "/requests/:id/duplicate",
  validate({ params: idParamsSchema }),
  wrap(collectionController.duplicateRequest),
);
apiRouter.get("/environments", wrap(environmentController.listEnvironments));
apiRouter.post(
  "/environments",
  validate({ body: environmentBodySchema }),
  wrap(environmentController.createEnvironment),
);
apiRouter.put(
  "/environments/:id",
  validate({ params: idParamsSchema, body: environmentBodySchema.partial() }),
  wrap(environmentController.updateEnvironment),
);
apiRouter.delete(
  "/environments/:id",
  validate({ params: idParamsSchema }),
  wrap(environmentController.deleteEnvironment),
);
apiRouter.post(
  "/environments/:id/activate",
  validate({ params: idParamsSchema }),
  wrap(environmentController.activateEnvironment),
);
apiRouter.get(
  "/environments/:id/variables",
  validate({ params: idParamsSchema }),
  wrap(environmentController.getVariables),
);
apiRouter.put(
  "/environments/:id/variables",
  validate({ params: idParamsSchema, body: variablesBodySchema }),
  wrap(environmentController.replaceVariables),
);
apiRouter.get(
  "/history",
  validate({ query: historyQuerySchema }),
  wrap(historyController.listHistory),
);
apiRouter.delete("/history", wrap(historyController.clearHistory));
apiRouter.delete(
  "/history/:id",
  validate({ params: idParamsSchema }),
  wrap(historyController.deleteHistory),
);

function wrap(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
