import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:3003/api" });

/**
 * Unwraps project response envelopes.
 * @param {Promise} request Axios request.
 * @returns {Promise<unknown>} Payload.
 */
async function unwrap(request) {
  const response = await request;
  return response.data.data;
}

export const expenseApi = {
  list: (params) => unwrap(api.get("/expenses", { params })),
  create: (payload) => unwrap(api.post("/expenses", payload)),
  update: (id, payload) => unwrap(api.put(`/expenses/${id}`, payload)),
  remove: (id) => unwrap(api.delete(`/expenses/${id}`)),
  exportCsv: (params) => api.get("/expenses/export", { params, responseType: "blob" })
};

export const categoryApi = {
  list: () => unwrap(api.get("/categories")),
  create: (payload) => unwrap(api.post("/categories", payload)),
  remove: (id) => unwrap(api.delete(`/categories/${id}`))
};

export const budgetApi = {
  list: (month) => unwrap(api.get("/budgets", { params: { month } })),
  upsert: (payload) => unwrap(api.post("/budgets", payload)),
  remove: (id) => unwrap(api.delete(`/budgets/${id}`))
};

export const statsApi = {
  monthly: (month) => unwrap(api.get("/stats/monthly", { params: { month } })),
  weekly: (week_start) => unwrap(api.get("/stats/weekly", { params: { week_start } })),
  byCategory: (params) => unwrap(api.get("/stats/by-category", { params })),
  daily: (month) => unwrap(api.get("/stats/daily-trend", { params: { month } }))
};
