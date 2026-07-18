import { useEffect, useMemo, useState } from "react";
import "./index.css";
import styles from "./App.module.css";
import { createRecord, deleteRecord, listRecords, loadStats, updateRecord } from "./services/api";

const emptyForm = {
  "sku": "SKU-001",
  "name": "Product",
  "category": "General",
  "status": "active",
  "tags": [
    "stocked"
  ]
};

/** Renders the complete Inventory Management learning UI. */
export default function App() {
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const filteredRecords = useMemo(() => {
    return records.filter((record) => JSON.stringify(record).toLowerCase().includes(search.toLowerCase()));
  }, [records, search]);

  /** Refreshes list and stats from the API. */
  async function refresh() {
    try {
      const [nextRecords, nextStats] = await Promise.all([listRecords(), loadStats()]);
      setRecords(nextRecords);
      setStats(nextStats);
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load records");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  /** Updates form state for text inputs. */
  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: field === "tags" ? value.split(",").map((tag) => tag.trim()).filter(Boolean) : value }));
  }

  /** Creates or updates a record through the API. */
  async function saveRecord(event) {
    event.preventDefault();
    try {
      if (editingId) {
        await updateRecord(editingId, form);
      } else {
        await createRecord(form);
      }
      setForm(emptyForm);
      setEditingId(null);
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save record");
    }
  }

  /** Loads a record into the form for editing. */
  function editRecord(record) {
    setEditingId(record.id);
    setForm({ ...emptyForm, ...record });
  }

  /** Deletes a record after a browser confirmation. */
  async function removeRecord(id) {
    if (!window.confirm("Delete this record?")) return;
    await deleteRecord(id);
    await refresh();
  }

  return (
    <main className={styles.shell}>
      <section className={styles.header}>
        <div>
          <p>{stats?.total ?? records.length} records</p>
          <h1>Inventory Management</h1>
        </div>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" />
      </section>

      {error && <div className={styles.error}>{error}</div>}

      <section className={styles.grid}>
        <form className={styles.panel} onSubmit={saveRecord}>
          <h2>{editingId ? "Edit" : "Create"} product</h2>
          <label>
            sku
            <input value={Array.isArray(form.sku) ? form.sku.join(", ") : form.sku ?? ""} onChange={(event) => updateField("sku", event.target.value)} />
          </label>
          <label>
            name
            <input value={Array.isArray(form.name) ? form.name.join(", ") : form.name ?? ""} onChange={(event) => updateField("name", event.target.value)} />
          </label>
          <label>
            category
            <input value={Array.isArray(form.category) ? form.category.join(", ") : form.category ?? ""} onChange={(event) => updateField("category", event.target.value)} />
          </label>
          <label>
            status
            <input value={Array.isArray(form.status) ? form.status.join(", ") : form.status ?? ""} onChange={(event) => updateField("status", event.target.value)} />
          </label>
          <label>
            tags
            <input value={Array.isArray(form.tags) ? form.tags.join(", ") : form.tags ?? ""} onChange={(event) => updateField("tags", event.target.value)} />
          </label>
          <button>{editingId ? "Update" : "Create"}</button>
        </form>

        <section className={styles.list}>
          {filteredRecords.map((record) => (
            <article className={styles.card} key={record.id}>
              <div>
                <h3>{record.sku}</h3>
                <p>{record.name}</p>
                <small>{record.status || "active"}</small>
              </div>
              <div className={styles.actions}>
                <button onClick={() => editRecord(record)}>Edit</button>
                <button onClick={() => removeRecord(record.id)}>Delete</button>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
