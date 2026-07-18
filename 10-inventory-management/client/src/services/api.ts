import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4110/api",
  headers: { "Content-Type": "application/json" }
});

/** Reads the standard API response envelope. */
function unwrap<T>(response: { data: { success: boolean; data?: T; error?: { message: string } } }): T {
  if (!response.data.success) {
    throw new Error(response.data.error?.message || "Request failed");
  }

  return response.data.data as T;
}

/** Lists products for the workspace screen. */
export async function listRecords(filters = {}) {
  const response = await api.get("/products", { params: filters });
  return unwrap(response);
}

/** Creates a new product. */
export async function createRecord(payload) {
  const response = await api.post("/products", payload);
  return unwrap(response);
}

/** Updates an existing product. */
export async function updateRecord(id, payload) {
  const response = await api.put(`/products/${id}`, payload);
  return unwrap(response);
}

/** Deletes an existing product. */
export async function deleteRecord(id) {
  const response = await api.delete(`/products/${id}`);
  return unwrap(response);
}

/** Loads aggregate dashboard stats. */
export async function loadStats() {
  const response = await api.get("/products/stats");
  return unwrap(response);
}
