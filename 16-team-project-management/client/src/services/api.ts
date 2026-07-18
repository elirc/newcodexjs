import axios from "axios";
import type { Dashboard, RecordItem, SavedView, ActivityEvent, AuditEvent, Comment } from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4116/api",
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
    await api.get("/tasks", { params })
  );
}

export async function loadDashboard() {
  return unwrap<Dashboard>(await api.get("/tasks/dashboard"));
}

export async function loadActivity() {
  return unwrap<ActivityEvent[]>(await api.get("/tasks/activity"));
}

export async function loadAudit() {
  return unwrap<AuditEvent[]>(await api.get("/tasks/audit"));
}

export async function loadViews() {
  return unwrap<SavedView[]>(await api.get("/tasks/views"));
}

export async function saveView(payload: Partial<SavedView>) {
  return unwrap<SavedView>(await api.post("/tasks/views", payload));
}

export async function createRecord(payload: Partial<RecordItem>) {
  return unwrap<RecordItem>(await api.post("/tasks", payload));
}

export async function updateRecord(id: number, payload: Partial<RecordItem>) {
  return unwrap<RecordItem>(await api.put(`/tasks/${id}`, payload));
}

export async function archiveRecord(id: number) {
  return unwrap<RecordItem>(await api.patch(`/tasks/${id}/archive`));
}

export async function restoreRecord(id: number) {
  return unwrap<RecordItem>(await api.patch(`/tasks/${id}/restore`));
}

export async function deleteRecord(id: number) {
  return unwrap<RecordItem>(await api.delete(`/tasks/${id}`));
}

export async function bulkStatus(ids: number[], status: string) {
  return unwrap<RecordItem[]>(await api.post("/tasks/bulk/status", { ids, status }));
}

export async function loadComments(id: number) {
  return unwrap<Comment[]>(await api.get(`/tasks/${id}/comments`));
}

export async function addComment(id: number, body: string, isInternal = false) {
  return unwrap<Comment>(await api.post(`/tasks/${id}/comments`, { body, is_internal: isInternal }));
}
