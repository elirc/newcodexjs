import { Router } from "express";
import * as providerController from "../controllers/providerController";
import { validate } from "../middleware/validate";
import {
  availabilityBodySchema,
  idParamsSchema,
  overrideBodySchema,
  overrideParamsSchema,
  profileBodySchema,
  providerListQuerySchema,
  serviceBodySchema,
  serviceParamsSchema,
  slotsQuerySchema
} from "../validators/providerValidators";

export const providerRouter = Router();

providerRouter.get("/providers", validate({ query: providerListQuerySchema }), providerController.listProviders);
providerRouter.get("/providers/:id", validate({ params: idParamsSchema }), providerController.getProvider);
providerRouter.get("/providers/:id/available-slots", validate({ params: idParamsSchema, query: slotsQuerySchema }), providerController.getAvailableSlots);
providerRouter.get("/provider/profile", providerController.getOwnProfile);
providerRouter.put("/provider/profile", validate({ body: profileBodySchema }), providerController.updateOwnProfile);
providerRouter.get("/provider/services", providerController.listOwnServices);
providerRouter.post("/provider/services", validate({ body: serviceBodySchema }), providerController.createOwnService);
providerRouter.put("/provider/services/:id", validate({ params: serviceParamsSchema, body: serviceBodySchema.partial() }), providerController.updateOwnService);
providerRouter.delete("/provider/services/:id", validate({ params: serviceParamsSchema }), providerController.deleteOwnService);
providerRouter.get("/provider/availability", providerController.getOwnAvailability);
providerRouter.put("/provider/availability", validate({ body: availabilityBodySchema }), providerController.setOwnAvailability);
providerRouter.get("/provider/overrides", providerController.listOwnOverrides);
providerRouter.post("/provider/overrides", validate({ body: overrideBodySchema }), providerController.createOwnOverride);
providerRouter.delete("/provider/overrides/:id", validate({ params: overrideParamsSchema }), providerController.deleteOwnOverride);
