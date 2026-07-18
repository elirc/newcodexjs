import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3002/api"
});

/**
 * Unwraps the standard API response envelope.
 * @param {Promise} request Axios request promise.
 * @returns {Promise<unknown>} Response data.
 */
async function unwrap(request) {
  const response = await request;
  return response.data.data;
}

export const contactApi = {
  list: (params) => unwrap(api.get("/contacts", { params })),
  get: (id) => unwrap(api.get(`/contacts/${id}`)),
  create: (payload) => unwrap(api.post("/contacts", payload)),
  update: (id, payload) => unwrap(api.put(`/contacts/${id}`, payload)),
  remove: (id) => unwrap(api.delete(`/contacts/${id}`)),
  bulkDelete: (ids) => unwrap(api.post("/contacts/bulk-delete", { ids })),
  importCsv: (csv) => unwrap(api.post("/contacts/import", { csv })),
  exportCsv: () => api.get("/contacts/export", { responseType: "blob" })
};

export const tagApi = {
  list: () => unwrap(api.get("/tags")),
  create: (payload) => unwrap(api.post("/tags", payload)),
  update: (id, payload) => unwrap(api.put(`/tags/${id}`, payload)),
  remove: (id) => unwrap(api.delete(`/tags/${id}`))
};
