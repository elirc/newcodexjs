import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "./App.module.css";
import "./index.css";
import {
  createRecord,
  deleteRecord,
  listRecords,
  loadStats,
  updateRecord,
} from "./services/api";
import type { RecordInput, RecordItem, Stats } from "./types";
const emptyForm: RecordInput = {
  sku: "",
  name: "",
  category: "",
  status: "active",
  tags: [],
};
export default function App() {
  const [records, setRecords] = useState<RecordItem[]>([]),
    [stats, setStats] = useState<Stats | null>(null);
  const [form, setForm] = useState<RecordInput>(emptyForm),
    [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [pending, setPending] = useState(false);
  const sequence = useRef(0),
    mutation = useRef(false);
  async function refresh() {
    const request = ++sequence.current;
    try {
      const [items, totals] = await Promise.all([
        listRecords({ search }),
        loadStats(),
      ]);
      if (request === sequence.current) {
        setRecords(items);
        setStats(totals);
        setError("");
      }
    } catch (e) {
      if (request === sequence.current)
        setError(e instanceof Error ? e.message : "Could not load records.");
    }
  }
  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 150);
    return () => {
      clearTimeout(timer);
      sequence.current++;
    };
  }, [search]);
  function updateField(field: keyof RecordInput, value: string) {
    setForm((current) => ({
      ...current,
      [field]:
        field === "tags"
          ? value
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : value,
    }));
  }
  function cancel() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
  }
  async function saveRecord(event: FormEvent) {
    event.preventDefault();
    if (mutation.current) return;
    mutation.current = true;
    setPending(true);
    setError("");
    setMessage("");
    try {
      if (editingId !== null) await updateRecord(editingId, form);
      else await createRecord(form);
      setEditingId(null);
      setForm(emptyForm);
      setMessage("Record saved.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save record.");
    } finally {
      mutation.current = false;
      setPending(false);
    }
  }
  function editRecord(record: RecordItem) {
    setEditingId(record.id);
    setForm({
      sku: record.sku ?? "",
      name: record.name ?? "",
      category: record.category ?? "",
      status: record.status ?? "",
      tags: record.tags ?? [],
    });
    setMessage("");
    setError("");
  }
  async function removeRecord(id: number) {
    if (mutation.current || !window.confirm("Delete this record?")) return;
    mutation.current = true;
    setPending(true);
    setError("");
    try {
      await deleteRecord(id);
      if (editingId === id) cancel();
      setMessage("Record deleted.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete record.");
    } finally {
      mutation.current = false;
      setPending(false);
    }
  }
  return (
    <main className={styles.shell}>
      <section className={styles.header}>
        <div>
          <p>{stats?.total ?? records.length} records</p>
          <h1>Inventory Management</h1>
        </div>
        <input
          aria-label="Search records"
          placeholder="Search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </section>
      {error && (
        <div role="alert" className={styles.error}>
          {error}
        </div>
      )}
      <p role="status">{message}</p>
      <section className={styles.grid}>
        <form className={styles.panel} onSubmit={saveRecord}>
          <h2>{editingId === null ? "Create" : "Edit"} record</h2>
          <fieldset
            disabled={pending}
            style={{ border: 0, padding: 0, margin: 0 }}
          >
            <label>
              sku
              <input
                value={
                  Array.isArray(form.sku)
                    ? (form.sku as string[]).join(", ")
                    : form.sku
                }
                onChange={(event) => updateField("sku", event.target.value)}
              />
            </label>
            <label>
              name
              <input
                value={
                  Array.isArray(form.name)
                    ? (form.name as string[]).join(", ")
                    : form.name
                }
                onChange={(event) => updateField("name", event.target.value)}
              />
            </label>
            <label>
              category
              <input
                value={
                  Array.isArray(form.category)
                    ? (form.category as string[]).join(", ")
                    : form.category
                }
                onChange={(event) =>
                  updateField("category", event.target.value)
                }
              />
            </label>
            <label>
              status
              <input
                value={
                  Array.isArray(form.status)
                    ? (form.status as string[]).join(", ")
                    : form.status
                }
                onChange={(event) => updateField("status", event.target.value)}
              />
            </label>
            <label>
              tags
              <input
                value={
                  Array.isArray(form.tags)
                    ? (form.tags as string[]).join(", ")
                    : form.tags
                }
                onChange={(event) => updateField("tags", event.target.value)}
              />
            </label>
            <button type="submit">
              {pending ? "Saving…" : editingId === null ? "Create" : "Update"}
            </button>
            {editingId !== null && (
              <button type="button" onClick={cancel}>
                Cancel
              </button>
            )}
          </fieldset>
        </form>
        <section className={styles.list} aria-label="Records">
          {!records.length && <p>No matching records.</p>}
          {records.map((record) => (
            <article className={styles.card} key={record.id}>
              <div>
                <h3>{record.sku}</h3>
                <p>{record.name}</p>
                <small>{record.status}</small>
              </div>
              <div className={styles.actions}>
                <button disabled={pending} onClick={() => editRecord(record)}>
                  Edit
                </button>
                <button
                  disabled={pending}
                  onClick={() => void removeRecord(record.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
