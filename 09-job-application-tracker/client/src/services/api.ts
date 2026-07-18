import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4109/api",
  headers: { "Content-Type": "application/json" }
});

/** Reads the standard API response envelope. */
function unwrap<T>(response: { data: { success: boolean; data?: T; error?: { message: string } } }): T {
  if (!response.data.success) {
    throw new Error(response.data.error?.message || "Request failed");
  }

  return response.data.data as T;
}

/** Lists applications for the workspace screen. */
export async function listRecords(filters = {}) {
  const response = await api.get("/applications", { params: filters });
  return unwrap(response);
}

/** Creates a new application. */
export async function createRecord(payload) {
  const response = await api.post("/applications", payload);
  return unwrap(response);
}

/** Updates an existing application. */
export async function updateRecord(id, payload) {
  const response = await api.put(`/applications/${id}`, payload);
  return unwrap(response);
}

/** Deletes an existing application. */
export async function deleteRecord(id) {
  const response = await api.delete(`/applications/${id}`);
  return unwrap(response);
}

/** Loads aggregate dashboard stats. */
export async function loadStats() {
  const response = await api.get("/applications/stats");
  return unwrap(response);
}
