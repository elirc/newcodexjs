import * as availabilityModel from "../models/availabilityModel";
import * as providerModel from "../models/providerModel";
import * as serviceModel from "../models/serviceModel";
import { NotFoundError } from "../utils/errors";

/** Returns provider cards for customer browsing. */
export async function listProviders(filters: providerModel.ProviderFilters) {
  return providerModel.listProviders(filters);
}

/** Returns a provider profile with its active services. */
export async function getProviderProfile(id: number) {
  const provider = await providerModel.findProviderById(id);
  if (!provider) throw new NotFoundError("Provider not found");
  const services = await serviceModel.listServices(id);
  return { ...provider, services };
}

/** Gets the provider profile attached to the current development user. */
export async function getOwnProvider(userId: number) {
  const provider = await providerModel.findProviderByUserId(userId);
  if (!provider) throw new NotFoundError("Provider profile not found for user");
  return provider;
}

/** Updates the current provider profile. */
export async function updateOwnProfile(userId: number, values: Record<string, unknown>) {
  const [profile] = await providerModel.updateProviderProfile(userId, values);
  if (!profile) throw new NotFoundError("Provider profile not found");
  return profile;
}

/** Lists services owned by the current provider user. */
export async function listOwnServices(userId: number) {
  const provider = await getOwnProvider(userId);
  return serviceModel.listServices(provider.id, true);
}

/** Creates a service for the current provider user. */
export async function createOwnService(userId: number, values: Record<string, unknown>) {
  const provider = await getOwnProvider(userId);
  return serviceModel.createService({ ...values, provider_id: provider.id });
}

/** Updates a service owned by the current provider user. */
export async function updateOwnService(userId: number, serviceId: number, values: Record<string, unknown>) {
  const provider = await getOwnProvider(userId);
  const service = await serviceModel.updateService(serviceId, provider.id, values);
  if (!service) throw new NotFoundError("Service not found");
  return service;
}

/** Deactivates a service owned by the current provider user. */
export async function deleteOwnService(userId: number, serviceId: number) {
  const provider = await getOwnProvider(userId);
  const service = await serviceModel.deactivateService(serviceId, provider.id);
  if (!service) throw new NotFoundError("Service not found");
  return service;
}

/** Replaces the current provider's weekly availability. */
export async function setOwnAvailability(userId: number, slots: Array<Record<string, unknown>>) {
  const provider = await getOwnProvider(userId);
  return availabilityModel.replaceAvailability(provider.id, slots);
}

/** Lists the current provider's weekly availability. */
export async function getOwnAvailability(userId: number) {
  const provider = await getOwnProvider(userId);
  return availabilityModel.listAvailability(provider.id);
}

/** Creates or updates a provider's date-specific availability override. */
export async function createOwnOverride(userId: number, values: Record<string, unknown>) {
  const provider = await getOwnProvider(userId);
  return availabilityModel.upsertOverride({ ...values, provider_id: provider.id });
}

/** Lists provider override rows for settings and calendar screens. */
export async function listOwnOverrides(userId: number, startDate?: string, endDate?: string) {
  const provider = await getOwnProvider(userId);
  return availabilityModel.listOverrides(provider.id, startDate, endDate);
}

/** Removes a provider override row. */
export async function deleteOwnOverride(userId: number, overrideId: number) {
  const provider = await getOwnProvider(userId);
  return availabilityModel.deleteOverride(overrideId, provider.id);
}
