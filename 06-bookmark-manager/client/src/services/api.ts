import axios from "axios";

export interface Bookmark { id: number; title: string; url: string; collection: string; status: string; tags: string[] }

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4106/api",
  headers: { "Content-Type": "application/json" }
});

/** Reads the standard API response envelope. */
function unwrap<T>(response: { data: { success: boolean; data?: T; error?: { message: string } } }): T {
  if (!response.data.success) {
    throw new Error(response.data.error?.message || "Request failed");
  }

  return response.data.data as T;
}

/** Lists bookmarks for the workspace screen. */
export async function listRecords(filters = {}) {
  const response = await api.get("/bookmarks", { params: filters });
  return unwrap<Bookmark[]>(response);
}

/** Creates a new bookmark. */
export async function createRecord(payload) {
  const response = await api.post("/bookmarks", payload);
  return unwrap(response);
}

/** Updates an existing bookmark. */
export async function updateRecord(id, payload) {
  const response = await api.put(`/bookmarks/${id}`, payload);
  return unwrap(response);
}

/** Deletes an existing bookmark. */
export async function deleteRecord(id) {
  const response = await api.delete(`/bookmarks/${id}`);
  return unwrap(response);
}

/** Loads aggregate dashboard stats. */
export async function loadStats() {
  const response = await api.get("/bookmarks/stats");
  return unwrap(response);
}

export async function previewMetadata(url: string): Promise<{ url: string; title: string }> {
  return unwrap(await api.post("/bookmarks/metadata", { url }));
}
