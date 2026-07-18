import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4104/api",
  headers: { "Content-Type": "application/json" }
});

/** Reads the standard API response envelope. */
function unwrap(response) {
  if (!response.data.success) {
    throw new Error(response.data.error?.message || "Request failed");
  }

  return response.data.data;
}

/** Lists notes for the workspace screen. */
export async function listRecords(filters = {}) {
  const response = await api.get("/notes", { params: filters });
  return unwrap(response);
}

/** Creates a new note. */
export async function createRecord(payload) {
  const response = await api.post("/notes", payload);
  return unwrap(response);
}

/** Updates an existing note. */
export async function updateRecord(id, payload) {
  const response = await api.put(`/notes/${id}`, payload);
  return unwrap(response);
}

/** Deletes an existing note. */
export async function deleteRecord(id) {
  const response = await api.delete(`/notes/${id}`);
  return unwrap(response);
}

/** Loads aggregate dashboard stats. */
export async function loadStats() {
  const response = await api.get("/notes/stats");
  return unwrap(response);
}
