export interface RecordInput {
  title: string;
  body: string;
  slug: string;
  status: string;
  tags: string[];
}
export interface RecordItem extends RecordInput {
  id: number;
  created_at: string;
  updated_at: string;
}
export interface Stats {
  total: number;
  byStatus: Array<{ status: string; count: string }>;
}
