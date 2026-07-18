import { Router } from "express";
import * as collectionController from "../controllers/collectionController";
import * as environmentController from "../controllers/environmentController";
import * as historyController from "../controllers/historyController";
import * as proxyController from "../controllers/proxyController";
import { validate } from "../middleware/validate";
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
  variablesBodySchema
} from "../validators/schemas";

export const apiRouter = Router();

apiRouter.post("/proxy", validate({ body: proxyBodySchema }), proxyController.sendProxyRequest);
apiRouter.get("/collections", collectionController.listCollections);
apiRouter.post("/collections", validate({ body: collectionBodySchema }), collectionController.createCollection);
apiRouter.put("/collections/:id", validate({ params: idParamsSchema, body: collectionBodySchema.partial() }), collectionController.updateCollection);
apiRouter.delete("/collections/:id", validate({ params: idParamsSchema }), collectionController.deleteCollection);
apiRouter.post("/collections/:id/import", validate({ params: idParamsSchema, body: importBodySchema }), collectionController.importCollection);
apiRouter.get("/collections/:id/export", validate({ params: idParamsSchema }), collectionController.exportCollection);
apiRouter.post("/collections/:collectionId/folders", validate({ params: collectionFolderParamsSchema, body: folderBodySchema }), collectionController.createFolder);
apiRouter.put("/folders/:id", validate({ params: idParamsSchema, body: folderBodySchema.partial() }), collectionController.updateFolder);
apiRouter.delete("/folders/:id", validate({ params: idParamsSchema }), collectionController.deleteFolder);
apiRouter.get("/requests/:id", validate({ params: idParamsSchema }), collectionController.getRequest);
apiRouter.post("/requests", validate({ body: requestBodySchema }), collectionController.saveRequest);
apiRouter.put("/requests/:id", validate({ params: idParamsSchema, body: requestBodySchema.partial() }), collectionController.updateRequest);
apiRouter.delete("/requests/:id", validate({ params: idParamsSchema }), collectionController.deleteRequest);
apiRouter.post("/requests/:id/duplicate", validate({ params: idParamsSchema }), collectionController.duplicateRequest);
apiRouter.get("/environments", environmentController.listEnvironments);
apiRouter.post("/environments", validate({ body: environmentBodySchema }), environmentController.createEnvironment);
apiRouter.put("/environments/:id", validate({ params: idParamsSchema, body: environmentBodySchema.partial() }), environmentController.updateEnvironment);
apiRouter.delete("/environments/:id", validate({ params: idParamsSchema }), environmentController.deleteEnvironment);
apiRouter.post("/environments/:id/activate", validate({ params: idParamsSchema }), environmentController.activateEnvironment);
apiRouter.get("/environments/:id/variables", validate({ params: idParamsSchema }), environmentController.getVariables);
apiRouter.put("/environments/:id/variables", validate({ params: idParamsSchema, body: variablesBodySchema }), environmentController.replaceVariables);
apiRouter.get("/history", validate({ query: historyQuerySchema }), historyController.listHistory);
apiRouter.delete("/history", historyController.clearHistory);
apiRouter.delete("/history/:id", validate({ params: idParamsSchema }), historyController.deleteHistory);
