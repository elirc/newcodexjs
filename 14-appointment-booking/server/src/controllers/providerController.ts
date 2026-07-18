import type { Request, Response } from "express";
import type { ProviderFilters } from "../models/providerModel";
import * as providerService from "../services/providerService";
import * as slotService from "../services/slotService";
import { sendSuccess } from "../utils/response";

/** Handles public provider listing. */
export async function listProviders(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await providerService.listProviders(req.query as ProviderFilters));
}

/** Handles public provider profile lookups. */
export async function getProvider(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await providerService.getProviderProfile(Number(req.params.id)));
}

/** Handles available slot calculation for a provider and service. */
export async function getAvailableSlots(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await slotService.getAvailableSlots(Number(req.params.id), String(req.query.date), Number(req.query.serviceId)));
}

/** Handles current provider profile reads. */
export async function getOwnProfile(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await providerService.getOwnProvider(req.user!.id));
}

/** Handles current provider profile updates. */
export async function updateOwnProfile(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await providerService.updateOwnProfile(req.user!.id, req.body));
}

/** Handles provider service listing. */
export async function listOwnServices(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await providerService.listOwnServices(req.user!.id));
}

/** Handles provider service creation. */
export async function createOwnService(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await providerService.createOwnService(req.user!.id, req.body), 201);
}

/** Handles provider service updates. */
export async function updateOwnService(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await providerService.updateOwnService(req.user!.id, Number(req.params.id), req.body));
}

/** Handles provider service deactivation. */
export async function deleteOwnService(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await providerService.deleteOwnService(req.user!.id, Number(req.params.id)));
}

/** Handles weekly availability reads. */
export async function getOwnAvailability(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await providerService.getOwnAvailability(req.user!.id));
}

/** Handles weekly availability replacement. */
export async function setOwnAvailability(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await providerService.setOwnAvailability(req.user!.id, req.body));
}

/** Handles override listing. */
export async function listOwnOverrides(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await providerService.listOwnOverrides(req.user!.id, String(req.query.startDate ?? ""), String(req.query.endDate ?? "")));
}

/** Handles override creation. */
export async function createOwnOverride(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await providerService.createOwnOverride(req.user!.id, req.body), 201);
}

/** Handles override deletion. */
export async function deleteOwnOverride(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await providerService.deleteOwnOverride(req.user!.id, Number(req.params.id)));
}
