export interface KeyValuePair {
  key: string;
  value: string;
  enabled?: boolean;
}

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export interface RequestDraft {
  id?: number;
  name: string;
  method: Method;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  bodyType: "json" | "form-data" | "raw" | "none";
  body: string;
  auth: { type: "none" | "bearer" | "basic"; token?: string; username?: string; password?: string };
  dirty?: boolean;
}

export interface ProxyResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  sizeBytes: number;
  timing: { totalMs: number };
  error?: string;
}

export interface SavedRequest {
  id: number;
  collection_id: number | null;
  folder_id: number | null;
  name: string;
  method: Method;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body_type: RequestDraft["bodyType"];
  body_content: string | null;
  auth_type: RequestDraft["auth"]["type"];
  auth_config: Record<string, string> | null;
}

export interface Folder {
  id: number;
  name: string;
  requests: SavedRequest[];
}

export interface Collection {
  id: number;
  name: string;
  description?: string;
  folders: Folder[];
  requests: SavedRequest[];
}

export interface EnvironmentVariable {
  id?: number;
  key: string;
  value: string;
  is_secret?: boolean;
}

export interface Environment {
  id: number;
  name: string;
  is_active: boolean;
  variables: EnvironmentVariable[];
}

export interface HistoryEntry {
  id: number;
  method: Method;
  url: string;
  response_status?: number;
  response_time_ms?: number;
  created_at: string;
}
