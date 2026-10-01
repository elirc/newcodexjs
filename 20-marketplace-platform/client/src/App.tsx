import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./App.module.css";
import "./index.css";
import {
  addComment,
  archiveRecord,
  bulkStatus,
  createRecord,
  deleteRecord,
  listRecords,
  loadActivity,
  loadAudit,
  loadComments,
  loadDashboard,
  loadViews,
  restoreRecord,
  saveView,
  updateRecord
} from "./services/api";
import type { ActivityEvent, AuditEvent, Comment, Dashboard, RecordItem, SavedView } from "./types";

const emptyForm = {
  "title": "Enterprise Desk Bundle",
  "status": "active",
  "priority": "featured",
  "owner": "Northwind Goods",
  "metadata": {
    "price": 349,
    "inventory": 24,
    "category": "office"
  }
};
const statusOptions = ["draft","active","flagged","paused","archived"];
const priorityOptions = ["low","medium","high","featured"];

export default function App() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [views, setViews] = useState<SavedView[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [selected, setSelected] = useState<RecordItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [filters, setFilters] = useState({ search: "", status: "", priority: "", includeArchived: "false", page: "1", pageSize: "25", sort: "updated_at", order: "desc" });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0 });
  const [error, setError] = useState("");

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filtersRef = useRef(filters);
  const refreshSequence = useRef(0);

  async function refresh(nextFilters = filtersRef.current) {
    const sequence = ++refreshSequence.current;
    try {
      const [list, nextDashboard, nextActivity, nextAudit, nextViews] = await Promise.all([
        listRecords(nextFilters),
        loadDashboard(),
        loadActivity(),
        loadAudit(),
        loadViews()
      ]);
      if (sequence !== refreshSequence.current) return;
      setRecords(list.rows);
      setPagination(list.pagination);
      setDashboard(nextDashboard);
      setActivity(nextActivity);
      setAudit(nextAudit);
      setViews(nextViews);
      setError("");
    } catch (requestError) {
      if (sequence !== refreshSequence.current) return;
      setError(requestError instanceof Error ? requestError.message : "Unable to load enterprise workspace");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function updateFilter(field: string, value: string) {
    const nextFilters = { ...filters, [field]: value, page: field === "page" ? value : "1" };
    filtersRef.current = nextFilters;
    setFilters(nextFilters);
    refresh(nextFilters);
  }

  function updateField(field: string, value: string) {
    setForm((current: any) => ({ ...current, [field]: field === "metadata" ? safeMetadata(value) : value }));
  }

  function metadataValue() {
    return typeof form.metadata === "string" ? form.metadata : JSON.stringify(form.metadata, null, 2);
  }

  async function saveRecord(event: React.FormEvent) {
    event.preventDefault();
    try {
    if (editingId) await updateRecord(editingId, form);
    else await createRecord(form);
    setEditingId(null);
    setForm(emptyForm);
    await refresh();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to save record"); }
  }

  async function inspectRecord(record: RecordItem) {
    setSelected(record);
    setComments(await loadComments(record.id));
  }

  function editRecord(record: RecordItem) {
    setEditingId(record.id);
    setForm({ ...record });
  }

  function toggleSelected(id: number) {
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  async function runBulkStatus(status: string) {
    if (selectedIds.length === 0) return;
    await bulkStatus(selectedIds, status);
    setSelectedIds([]);
    await refresh();
  }

  async function postComment() {
    if (!selected || !commentText.trim()) return;
    await addComment(selected.id, commentText, true);
    setCommentText("");
    setComments(await loadComments(selected.id));
    await refresh();
  }

  async function persistView() {
    await saveView({ name: `View: ${filters.status || "all"} / ${filters.priority || "all"}`, filters });
    setViews(await loadViews());
  }

  return (
    <main className={styles.shell}>
      <section className={styles.header}>
        <div>
          <p>Enterprise Project 20</p>
          <h1>Multi-Vendor Marketplace</h1>
        </div>
        <button onClick={persistView}>Save current view</button>
      </section>

      {error && <div className={styles.error}>{error}</div>}

      <section className={styles.metrics}>
        <article><span>{dashboard?.total ?? 0}</span><p>Total active</p></article>
        <article><span>{dashboard?.archived ?? 0}</span><p>Archived</p></article>
        <article><span>{pagination.total}</span><p>Filtered total</p></article>
        <article><span>{audit.length}</span><p>Audit events</p></article>
      </section>

      <section className={styles.filters}>
        <input value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Search" />
        <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
          <option value="">All statuses</option>
          {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <select value={filters.priority} onChange={(event) => updateFilter("priority", event.target.value)}>
          <option value="">All priorities</option>
          {priorityOptions.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
        </select>
        <label><input type="checkbox" checked={filters.includeArchived === "true"} onChange={(event) => updateFilter("includeArchived", String(event.target.checked))} /> Include archived</label>
      </section>

      <section className={styles.bulkBar}>
        <span>{selectedIds.length} selected</span>
        {statusOptions.map((status) => <button key={status} onClick={() => runBulkStatus(status)}>Move to {status}</button>)}
      </section>

      <section className={styles.grid}>
        <form className={styles.panel} onSubmit={saveRecord}>
          <h2>{editingId ? "Edit" : "Create"} listing</h2>
          <label>title<input value={form.title ?? ""} onChange={(event) => updateField("title", event.target.value)} /></label>
          <label>status<select value={form.status ?? ""} onChange={(event) => updateField("status", event.target.value)}>{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
          <label>priority<select value={form.priority ?? ""} onChange={(event) => updateField("priority", event.target.value)}>{priorityOptions.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select></label>
          <label>Merchant<input value={form.owner ?? ""} onChange={(event) => updateField("owner", event.target.value)} /></label>
          <label>risk level<input value={form.risk_level ?? "normal"} onChange={(event) => updateField("risk_level", event.target.value)} /></label>
          <label>due date<input type="datetime-local" value={form.due_at ?? ""} onChange={(event) => updateField("due_at", event.target.value)} /></label>
          <label>metadata JSON<textarea value={metadataValue()} onChange={(event) => updateField("metadata", event.target.value)} /></label>
          <button>{editingId ? "Update" : "Create"}</button>
        </form>

        <section className={styles.list}>
          {records.map((record) => (
            <article className={styles.card} key={record.id}>
              <input type="checkbox" checked={selectedSet.has(record.id)} onChange={() => toggleSelected(record.id)} />
              <div onClick={() => inspectRecord(record)}>
                <h3>{record.title}</h3>
                <p>{record.owner} | {record.status} | {record.priority} | v{record.version}</p>
                <code>{JSON.stringify(record.metadata)}</code>
              </div>
              <div className={styles.actions}>
                <button onClick={() => editRecord(record)}>Edit</button>
                {record.archived_at ? <button onClick={() => restoreRecord(record.id).then(() => refresh())}>Restore</button> : <button onClick={() => archiveRecord(record.id).then(() => refresh())}>Archive</button>}
                <button onClick={() => deleteRecord(record.id).then(() => refresh())}>Delete</button>
              </div>
            </article>
          ))}
        </section>

        <aside className={styles.sidePanel}>
          <h2>Saved Views</h2>
          {views.map((view) => <article key={view.id}><strong>{view.name}</strong><pre>{JSON.stringify(view.filters, null, 2)}</pre></article>)}
          <h2>Activity</h2>
          {activity.slice(0, 8).map((event) => <article key={event.id}><strong>{event.event_type}</strong><p>{event.message}</p></article>)}
        </aside>

        <aside className={styles.detailPanel}>
          <h2>{selected ? selected.title : "Select a record"}</h2>
          {selected && (
            <>
              <p>Use comments as internal collaboration notes and review artifacts.</p>
              <textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Internal note" />
              <button onClick={postComment}>Add comment</button>
              {comments.map((comment) => <article key={comment.id}><strong>{comment.author}</strong><p>{comment.body}</p></article>)}
            </>
          )}
        </aside>
      </section>
    </main>
  );
}

function safeMetadata(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
