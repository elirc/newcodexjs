import * as collectionModel from "../models/collectionModel";
import * as requestModel from "../models/requestModel";
import { NotFoundError } from "../utils/errors";

/** Lists the sidebar collection tree. */
export async function listCollections(userId: number) {
  return collectionModel.listCollectionTree(userId);
}

/** Creates a collection. */
export async function createCollection(userId: number, values: Record<string, unknown>) {
  return collectionModel.createCollection(userId, values);
}

/** Updates a collection or throws when missing. */
export async function updateCollection(userId: number, id: number, values: Record<string, unknown>) {
  const collection = await collectionModel.updateCollection(id, userId, values);
  if (!collection) throw new NotFoundError("Collection not found");
  return collection;
}

/** Deletes a collection. */
export async function deleteCollection(userId: number, id: number) {
  return collectionModel.deleteCollection(id, userId);
}

/** Imports request JSON into a collection. */
export async function importCollection(userId: number, collectionId: number, payload: { requests?: Array<Record<string, unknown>> }) {
  return requestModel.importRequests(userId, collectionId, payload.requests ?? []);
}

/** Exports one collection tree. */
export async function exportCollection(userId: number, id: number) {
  const collection = await collectionModel.exportCollection(id, userId);
  if (!collection) throw new NotFoundError("Collection not found");
  return collection;
}

/** Creates a folder in a collection. */
export async function createFolder(collectionId: number, values: Record<string, unknown>) {
  return collectionModel.createFolder(collectionId, values);
}

/** Updates a folder. */
export async function updateFolder(id: number, values: Record<string, unknown>) {
  const folder = await collectionModel.updateFolder(id, values);
  if (!folder) throw new NotFoundError("Folder not found");
  return folder;
}

/** Deletes a folder. */
export async function deleteFolder(id: number) {
  return collectionModel.deleteFolder(id);
}

/** Gets a saved request. */
export async function getSavedRequest(userId: number, id: number) {
  const request = await requestModel.findSavedRequest(id, userId);
  if (!request) throw new NotFoundError("Request not found");
  return request;
}

/** Saves a request to a collection or folder. */
export async function saveRequest(userId: number, values: Record<string, unknown>) {
  return requestModel.createSavedRequest(userId, values);
}

/** Updates a saved request. */
export async function updateRequest(userId: number, id: number, values: Record<string, unknown>) {
  const request = await requestModel.updateSavedRequest(id, userId, values);
  if (!request) throw new NotFoundError("Request not found");
  return request;
}

/** Deletes a saved request. */
export async function deleteRequest(userId: number, id: number) {
  return requestModel.deleteSavedRequest(id, userId);
}

/** Duplicates a saved request. */
export async function duplicateRequest(userId: number, id: number) {
  const request = await requestModel.duplicateSavedRequest(id, userId);
  if (!request) throw new NotFoundError("Request not found");
  return request;
}
