import { useEffect, useMemo, useState } from "react";
import { Button } from "./components/ui/Button.jsx";
import { contactApi, tagApi } from "./services/api.js";
import { useDebounce } from "./features/contacts/useDebounce.js";
import styles from "./App.module.css";

const emptyContact = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  company: "",
  street_address: "",
  city: "",
  state: "",
  zip_code: "",
  country: "USA",
  notes: "",
  tagIds: []
};

/**
 * Renders a colored tag pill.
 * @param {{tag: object}} props Component props.
 * @returns {JSX.Element}
 */
function TagPill({ tag }) {
  return (
    <span className={styles.tag} style={{ backgroundColor: tag.color }}>
      {tag.name}
    </span>
  );
}

/**
 * Renders the contact edit/create form.
 * @param {object} props Component props.
 * @returns {JSX.Element}
 */
function ContactForm({ form, tags, onChange, onToggleTag, onSubmit, onCancel }) {
  return (
    <form className={styles.formGrid} onSubmit={onSubmit}>
      <h2>{form.id ? "Edit contact" : "New contact"}</h2>
      <input className={styles.input} placeholder="First name" value={form.first_name} onChange={(event) => onChange("first_name", event.target.value)} />
      <input className={styles.input} placeholder="Last name" value={form.last_name} onChange={(event) => onChange("last_name", event.target.value)} />
      <input className={styles.input} placeholder="Email" value={form.email || ""} onChange={(event) => onChange("email", event.target.value)} />
      <input className={styles.input} placeholder="Phone" value={form.phone || ""} onChange={(event) => onChange("phone", event.target.value)} />
      <input className={styles.input} placeholder="Company" value={form.company || ""} onChange={(event) => onChange("company", event.target.value)} />
      <input className={styles.input} placeholder="Street address" value={form.street_address || ""} onChange={(event) => onChange("street_address", event.target.value)} />
      <input className={styles.input} placeholder="City" value={form.city || ""} onChange={(event) => onChange("city", event.target.value)} />
      <input className={styles.input} placeholder="State" value={form.state || ""} onChange={(event) => onChange("state", event.target.value)} />
      <input className={styles.input} placeholder="Zip" value={form.zip_code || ""} onChange={(event) => onChange("zip_code", event.target.value)} />
      <textarea className={styles.textarea} placeholder="Notes" value={form.notes || ""} onChange={(event) => onChange("notes", event.target.value)} />
      <div>
        {tags.map((tag) => (
          <label key={tag.id} className={styles.tag} style={{ backgroundColor: tag.color }}>
            <input checked={(form.tagIds || []).includes(tag.id)} onChange={() => onToggleTag(tag.id)} type="checkbox" /> {tag.name}
          </label>
        ))}
      </div>
      <div className={styles.actions}>
        <Button type="submit">{form.id ? "Save changes" : "Create contact"}</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

/**
 * Renders the sortable contact table.
 * @param {object} props Component props.
 * @returns {JSX.Element}
 */
function ContactTable({ contacts, selectedIds, sort, order, onSort, onSelect, onView, onEdit, onDelete }) {
  const headers = [
    ["last_name", "Name"],
    ["email", "Email"],
    ["company", "Company"],
    ["created_at", "Created"]
  ];
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Select</th>
            {headers.map(([key, label]) => (
              <th key={key}>
                <button className={styles.sortButton} onClick={() => onSort(key)}>
                  {label} {sort === key ? (order === "asc" ? "up" : "down") : ""}
                </button>
              </th>
            ))}
            <th>Tags</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id}>
              <td><input checked={selectedIds.includes(contact.id)} onChange={() => onSelect(contact.id)} type="checkbox" /></td>
              <td>{contact.first_name} {contact.last_name}</td>
              <td>{contact.email || "No email"}</td>
              <td>{contact.company || "Independent"}</td>
              <td>{new Date(contact.created_at).toLocaleDateString()}</td>
              <td>{contact.tags.map((tag) => <TagPill key={tag.id} tag={tag} />)}</td>
              <td className={styles.actions}>
                <Button variant="secondary" onClick={() => onView(contact.id)}>View</Button>
                <Button variant="secondary" onClick={() => onEdit(contact)}>Edit</Button>
                <Button variant="danger" onClick={() => onDelete(contact.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {contacts.length === 0 && <div className={styles.empty}>No contacts match the current filters.</div>}
    </div>
  );
}

/**
 * Renders the complete Contact Book app.
 * @returns {JSX.Element}
 */
export default function App() {
  const [contacts, setContacts] = useState([]);
  const [tags, setTags] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [query, setQuery] = useState({ page: 1, limit: 20, search: "", tag: "", sort: "last_name", order: "asc" });
  const [form, setForm] = useState(null);
  const [detail, setDetail] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [csv, setCsv] = useState("");
  const [tagForm, setTagForm] = useState({ name: "", color: "#6366f1" });
  const debouncedSearch = useDebounce(query.search, 300);

  const effectiveQuery = useMemo(() => ({ ...query, search: debouncedSearch }), [query, debouncedSearch]);

  useEffect(() => {
    contactApi.list(effectiveQuery).then((data) => {
      setContacts(data.contacts);
      setPagination(data.pagination);
    });
  }, [effectiveQuery]);

  useEffect(() => {
    tagApi.list().then(setTags);
  }, []);

  /**
   * Saves a contact from the active form.
   * @param {SubmitEvent} event Form submit event.
   */
  async function saveContact(event) {
    event.preventDefault();
    form.id ? await contactApi.update(form.id, form) : await contactApi.create(form);
    setForm(null);
    setQuery((current) => ({ ...current }));
  }

  /**
   * Exports contacts as a downloaded CSV file.
   */
  async function exportContacts() {
    const response = await contactApi.exportCsv();
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = "contacts.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className={styles.app}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div>
            <h1>Contact Book</h1>
            <p>Showing {contacts.length ? (pagination.page - 1) * pagination.limit + 1 : 0}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</p>
          </div>
          <Button onClick={() => setForm(emptyContact)}>New contact</Button>
        </header>

        <div className={styles.toolbar}>
          <input className={styles.input} placeholder="Search name, email, or company" value={query.search} onChange={(event) => setQuery({ ...query, search: event.target.value, page: 1 })} />
          <select className={styles.select} value={query.tag} onChange={(event) => setQuery({ ...query, tag: event.target.value, page: 1 })}>
            <option value="">All tags</option>
            {tags.map((tag) => <option key={tag.id} value={tag.name}>{tag.name}</option>)}
          </select>
          <Button variant="secondary" onClick={exportContacts}>Export CSV</Button>
          <Button variant="secondary" onClick={() => csv && contactApi.importCsv(csv).then(() => setQuery({ ...query }))}>Import CSV</Button>
          <input className={styles.input} placeholder="Paste CSV text" value={csv} onChange={(event) => setCsv(event.target.value)} />
        </div>

        {selectedIds.length > 0 && (
          <div className={styles.bulkBar}>
            <strong>{selectedIds.length} selected</strong>
            <Button variant="danger" onClick={() => contactApi.bulkDelete(selectedIds).then(() => { setSelectedIds([]); setQuery({ ...query }); })}>Delete selected</Button>
          </div>
        )}

        <div className={styles.tagManager}>
          <strong>Tags</strong>
          <div>{tags.map((tag) => <TagPill key={tag.id} tag={tag} />)}</div>
          <div className={styles.actions}>
            <input className={styles.input} placeholder="New tag" value={tagForm.name} onChange={(event) => setTagForm({ ...tagForm, name: event.target.value })} />
            <input className={styles.input} type="color" value={tagForm.color} onChange={(event) => setTagForm({ ...tagForm, color: event.target.value })} />
            <Button onClick={() => tagApi.create(tagForm).then(() => tagApi.list().then(setTags))}>Add tag</Button>
          </div>
        </div>

        {form && (
          <ContactForm
            form={form}
            tags={tags}
            onChange={(key, value) => setForm({ ...form, [key]: value })}
            onToggleTag={(tagId) => setForm({ ...form, tagIds: form.tagIds.includes(tagId) ? form.tagIds.filter((id) => id !== tagId) : [...form.tagIds, tagId] })}
            onSubmit={saveContact}
            onCancel={() => setForm(null)}
          />
        )}

        {detail && (
          <div className={styles.detail}>
            <h2>{detail.first_name} {detail.last_name}</h2>
            <p>{detail.email} · {detail.phone} · {detail.company}</p>
            <p>{[detail.street_address, detail.city, detail.state, detail.zip_code, detail.country].filter(Boolean).join(", ")}</p>
            <p>{detail.notes}</p>
            <Button variant="secondary" onClick={() => setDetail(null)}>Close</Button>
          </div>
        )}

        <ContactTable
          contacts={contacts}
          selectedIds={selectedIds}
          sort={query.sort}
          order={query.order}
          onSort={(sort) => setQuery({ ...query, sort, order: query.sort === sort && query.order === "asc" ? "desc" : "asc" })}
          onSelect={(id) => setSelectedIds(selectedIds.includes(id) ? selectedIds.filter((selectedId) => selectedId !== id) : [...selectedIds, id])}
          onView={(id) => contactApi.get(id).then(setDetail)}
          onEdit={(contact) => setForm({ ...contact, tagIds: contact.tags.map((tag) => tag.id) })}
          onDelete={(id) => contactApi.remove(id).then(() => setQuery({ ...query }))}
        />

        <div className={styles.pagination}>
          <Button variant="secondary" disabled={pagination.page <= 1} onClick={() => setQuery({ ...query, page: pagination.page - 1 })}>Previous</Button>
          <span>Page {pagination.page} of {pagination.pages || 1}</span>
          <Button variant="secondary" disabled={pagination.page >= pagination.pages} onClick={() => setQuery({ ...query, page: pagination.page + 1 })}>Next</Button>
        </div>
      </section>
    </main>
  );
}
