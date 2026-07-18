import axios from "axios";
import type { Dashboard, RecordItem, SavedView, ActivityEvent, AuditEvent, Comment } from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4117/api",
  headers: {
    "Content-Type": "application/json",
    "x-demo-user": "junior.operator@example.com",
    "x-demo-role": "operator"
  }
});

function unwrap<T>(response: { data: { success: boolean; data?: T; error?: { message: string } } }): T {
  if (!response.data.success) throw new Error(response.data.error?.message || "Request failed");
  return response.data.data as T;
}

export type ListParams = {
  search?: string;
  status?: string;
  priority?: string;
  includeArchived?: string;
  page?: string;
  pageSize?: string;
  sort?: string;
  order?: string;
};

export async function listRecords(params: ListParams = {}) {
  return unwrap<{ rows: RecordItem[]; pagination: { page: number; pageSize: number; total: number } }>(
    await api.get("/tickets", { params })
  );
}

export async function loadDashboard() {
  return unwrap<Dashboard>(await api.get("/tickets/dashboard"));
}

export async function loadActivity() {
  return unwrap<ActivityEvent[]>(await api.get("/tickets/activity"));
}

export async function loadAudit() {
  return unwrap<AuditEvent[]>(await api.get("/tickets/audit"));
}

export async function loadViews() {
  return unwrap<SavedView[]>(await api.get("/tickets/views"));
}

export async function saveView(payload: Partial<SavedView>) {
  return unwrap<SavedView>(await api.post("/tickets/views", payload));
}

export async function createRecord(payload: Partial<RecordItem>) {
  return unwrap<RecordItem>(await api.post("/tickets", payload));
}

export async function updateRecord(id: number, payload: Partial<RecordItem>) {
  return unwrap<RecordItem>(await api.put(`/tickets/${id}`, payload));
}

export async function archiveRecord(id: number) {
  return unwrap<RecordItem>(await api.patch(`/tickets/${id}/archive`));
}

export async function restoreRecord(id: number) {
  return unwrap<RecordItem>(await api.patch(`/tickets/${id}/restore`));
}

export async function deleteRecord(id: number) {
  return unwrap<RecordItem>(await api.delete(`/tickets/${id}`));
}

export async function bulkStatus(ids: number[], status: string) {
  return unwrap<RecordItem[]>(await api.post("/tickets/bulk/status", { ids, status }));
}

export async function loadComments(id: number) {
  return unwrap<Comment[]>(await api.get(`/tickets/${id}/comments`));
}

export async function addComment(id: number, body: string, isInternal = false) {
  return unwrap<Comment>(await api.post(`/tickets/${id}/comments`, { body, is_internal: isInternal }));
}
