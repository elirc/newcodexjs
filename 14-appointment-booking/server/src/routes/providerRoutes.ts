import type { RequestHandler } from "express";
import { Router } from "express";
import * as providerController from "../controllers/providerController.js";
import { validate } from "../middleware/validate.js";
import {
  availabilityBodySchema,
  idParamsSchema,
  overrideBodySchema,
  overrideParamsSchema,
  profileBodySchema,
  providerListQuerySchema,
  serviceBodySchema,
  serviceParamsSchema,
  slotsQuerySchema,
} from "../validators/providerValidators.js";

export const providerRouter = Router();

providerRouter.get(
  "/providers",
  validate({ query: providerListQuerySchema }),
  wrap(providerController.listProviders),
);
providerRouter.get(
  "/providers/:id",
  validate({ params: idParamsSchema }),
  wrap(providerController.getProvider),
);
providerRouter.get(
  "/providers/:id/available-slots",
  validate({ params: idParamsSchema, query: slotsQuerySchema }),
  wrap(providerController.getAvailableSlots),
);
providerRouter.get("/provider/profile", wrap(providerController.getOwnProfile));
providerRouter.put(
  "/provider/profile",
  validate({ body: profileBodySchema }),
  wrap(providerController.updateOwnProfile),
);
providerRouter.get(
  "/provider/services",
  wrap(providerController.listOwnServices),
);
providerRouter.post(
  "/provider/services",
  validate({ body: serviceBodySchema }),
  wrap(providerController.createOwnService),
);
providerRouter.put(
  "/provider/services/:id",
  validate({ params: serviceParamsSchema, body: serviceBodySchema.partial() }),
  wrap(providerController.updateOwnService),
);
providerRouter.delete(
  "/provider/services/:id",
  validate({ params: serviceParamsSchema }),
  wrap(providerController.deleteOwnService),
);
providerRouter.get(
  "/provider/availability",
  wrap(providerController.getOwnAvailability),
);
providerRouter.put(
  "/provider/availability",
  validate({ body: availabilityBodySchema }),
  wrap(providerController.setOwnAvailability),
);
providerRouter.get(
  "/provider/overrides",
  wrap(providerController.listOwnOverrides),
);
providerRouter.post(
  "/provider/overrides",
  validate({ body: overrideBodySchema }),
  wrap(providerController.createOwnOverride),
);
providerRouter.delete(
  "/provider/overrides/:id",
  validate({ params: overrideParamsSchema }),
  wrap(providerController.deleteOwnOverride),
);

function wrap(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
