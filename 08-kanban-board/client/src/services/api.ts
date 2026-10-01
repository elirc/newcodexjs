import type { RecordInput, RecordItem, Stats } from "../types";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4108/api",
  headers: { "Content-Type": "application/json" },
});

// Axios rejects non-2xx responses before unwrap; surface the server's validation message.
api.interceptors.response.use(
  (response) => response,
  (error) =>
    Promise.reject(
      new Error(
        error.response?.data?.error?.message ||
          error.message ||
          "Request failed",
      ),
    ),
);
/** Reads the standard API response envelope. */
function unwrap<T>(response: {
  data: { success: boolean; data?: T; error?: { message: string } };
}): T {
  if (!response.data.success) {
    throw new Error(response.data.error?.message || "Request failed");
  }

  return response.data.data as T;
}

/** Lists cards for the workspace screen. */
export async function listRecords(filters = {}) {
  const response = await api.get("/cards", { params: filters });
  return unwrap<RecordItem[]>(response);
}

/** Creates a new card. */
export async function createRecord(payload: RecordInput) {
  const response = await api.post("/cards", payload);
  return unwrap<RecordItem>(response);
}

/** Updates an existing card. */
export async function updateRecord(id: number, payload: Partial<RecordInput>) {
  const response = await api.put(`/cards/${id}`, payload);
  return unwrap<RecordItem>(response);
}

/** Deletes an existing card. */
export async function deleteRecord(id: number) {
  const response = await api.delete(`/cards/${id}`);
  return unwrap<RecordItem>(response);
}

/** Loads aggregate dashboard stats. */
export async function loadStats() {
  const response = await api.get("/cards/stats");
  return unwrap<Stats>(response);
}
