export type RecordItem = {
  id: number;
  workspace_id: number;
  title: string;
  status: string;
  priority: string;
  owner: string;
  metadata: Record<string, unknown>;
  due_at?: string | null;
  risk_level: string;
  version: number;
  archived_at?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivityEvent = {
  id: number;
  event_type: string;
  message: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export type AuditEvent = {
  id: number;
  actor: string;
  action: string;
  request_id: string;
  created_at: string;
};

export type SavedView = {
  id: number;
  workspace_id: number;
  name: string;
  filters: Record<string, unknown>;
  created_by: string;
};

export type Comment = {
  id: number;
  author: string;
  body: string;
  is_internal: boolean;
  created_at: string;
};

export type Dashboard = {
  total: number;
  archived: number;
  byStatus: Array<{ status: string; count: string | number }>;
  byPriority: Array<{ priority: string; count: string | number }>;
  recentActivity: ActivityEvent[];
};
