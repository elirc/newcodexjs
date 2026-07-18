import axios from "axios";
import type { Collection, Environment, HistoryEntry, ProxyResponse, RequestDraft, SavedRequest } from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4215/api",
  headers: { "x-user-id": "1" }
});

/** Unwraps the backend response envelope. */
function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

/** Converts server request shape into the UI draft shape. */
export function toDraft(request: SavedRequest): RequestDraft {
  return {
    id: request.id,
    name: request.name,
    method: request.method,
    url: request.url,
    params: request.params ?? [],
    headers: request.headers ?? [],
    bodyType: request.body_type ?? "none",
    body: request.body_content ?? "",
    auth: { type: request.auth_type ?? "none", ...(request.auth_config ?? {}) },
    dirty: false
  };
}

/** Converts the UI draft shape into the server saved request shape. */
function toSavedRequestPayload(draft: RequestDraft, collectionId?: number) {
  return {
    collection_id: collectionId ?? null,
    folder_id: null,
    name: draft.name,
    method: draft.method,
    url: draft.url,
    headers: draft.headers,
    params: draft.params,
    body_type: draft.bodyType,
    body_content: draft.body,
    auth_type: draft.auth.type,
    auth_config: draft.auth
  };
}

/** Fetches the collection tree. */
export async function fetchCollections(): Promise<Collection[]> {
  return unwrap(await api.get("/collections"));
}

/** Fetches all environments with variables. */
export async function fetchEnvironments(): Promise<Environment[]> {
  return unwrap(await api.get("/environments"));
}

/** Activates one environment. */
export async function activateEnvironment(id: number): Promise<Environment> {
  return unwrap(await api.post(`/environments/${id}/activate`));
}

/** Sends a request through the backend proxy. */
export async function sendProxyRequest(draft: RequestDraft, environmentId?: number): Promise<ProxyResponse> {
  return unwrap(
    await api.post("/proxy", {
      method: draft.method,
      url: draft.url,
      params: draft.params,
      headers: draft.headers,
      body: draft.bodyType === "none" ? undefined : draft.body,
      environmentId,
      auth: draft.auth
    })
  );
}

/** Saves the current draft as a new saved request. */
export async function saveRequest(draft: RequestDraft, collectionId?: number): Promise<SavedRequest> {
  return unwrap(await api.post("/requests", toSavedRequestPayload(draft, collectionId)));
}

/** Updates an existing saved request. */
export async function updateRequest(draft: RequestDraft): Promise<SavedRequest> {
  return unwrap(await api.put(`/requests/${draft.id}`, toSavedRequestPayload(draft)));
}

/** Duplicates an existing saved request. */
export async function duplicateRequest(id: number): Promise<SavedRequest> {
  return unwrap(await api.post(`/requests/${id}/duplicate`));
}

/** Exports one collection as JSON. */
export async function exportCollection(id: number): Promise<Collection> {
  return unwrap(await api.get(`/collections/${id}/export`));
}

/** Imports saved requests into one collection from exported JSON. */
export async function importCollection(id: number, payload: { requests?: SavedRequest[] }): Promise<SavedRequest[]> {
  return unwrap(await api.post(`/collections/${id}/import`, { requests: payload.requests ?? [] }));
}

/** Fetches recent request history. */
export async function fetchHistory(): Promise<{ items: HistoryEntry[]; total: number }> {
  return unwrap(await api.get("/history", { params: { page: 1, limit: 30 } }));
}
