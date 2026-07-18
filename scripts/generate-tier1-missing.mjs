import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const projects = [
  {
    slug: "04-notes-app",
    title: "Notes App",
    language: "js",
    port: 4104,
    database: "notes_app_dev",
    feature: "notes",
    entity: "note",
    table: "notes",
    collection: "notes",
    dependencies: { "react-markdown": "^9.0.1", "remark-gfm": "^4.0.0" },
    schema: [
      ["title", "string", "Untitled note"],
      ["body", "text", "# Draft"],
      ["folder", "string", "General"],
      ["status", "string", "active"],
      ["tags", "json", ["learning", "markdown"]]
    ],
    seed: [
      { title: "Markdown Cheatsheet", body: "# Markdown\n\n- Lists\n- **Bold** text\n- Links", folder: "Learning", status: "active", tags: ["markdown", "reference"] },
      { title: "Project Ideas", body: "Build a tiny wiki, then add full-text search.", folder: "Ideas", status: "active", tags: ["ideas"] },
      { title: "Archived Scratchpad", body: "Old notes kept for history.", folder: "Archive", status: "archived", tags: ["archive"] }
    ],
    highlights: ["Markdown rendering", "folders and tags", "debounced autosave shape", "PostgreSQL full-text search notes"]
  },
  {
    slug: "06-bookmark-manager",
    title: "Bookmark Manager",
    language: "ts",
    port: 4106,
    database: "bookmark_manager_dev",
    feature: "bookmarks",
    entity: "bookmark",
    table: "bookmarks",
    collection: "bookmarks",
    dependencies: { zod: "^3.24.1" },
    schema: [
      ["title", "string", "Readable title"],
      ["url", "string", "https://example.com"],
      ["collection", "string", "Inbox"],
      ["status", "string", "active"],
      ["tags", "json", ["research"]]
    ],
    seed: [
      { title: "Knex Guide", url: "https://knexjs.org", collection: "Backend", status: "active", tags: ["sql", "knex"] },
      { title: "MDN Web Docs", url: "https://developer.mozilla.org", collection: "Frontend", status: "active", tags: ["reference"] },
      { title: "Old Vendor Link", url: "https://example.com/vendor", collection: "Archive", status: "archived", tags: ["archive"] }
    ],
    highlights: ["Zod validation", "API versioning", "external URL metadata placeholder", "bookmarklet-friendly API"]
  },
  {
    slug: "07-blog-platform",
    title: "Blog Platform",
    language: "ts",
    port: 4107,
    database: "blog_platform_dev",
    feature: "posts",
    entity: "post",
    table: "posts",
    collection: "posts",
    dependencies: { zod: "^3.24.1", "@tiptap/react": "^2.11.2", "@tiptap/starter-kit": "^2.11.2", dompurify: "^3.2.3", slugify: "^1.6.6", rss: "^1.2.2" },
    schema: [
      ["title", "string", "Post title"],
      ["body", "text", "Post body"],
      ["slug", "string", "post-title"],
      ["status", "string", "draft"],
      ["tags", "json", ["blog"]]
    ],
    seed: [
      { title: "Designing REST APIs", body: "Thin controllers keep route handlers boring.", slug: "designing-rest-apis", status: "published", tags: ["api"] },
      { title: "Nested Comments", body: "A parent_id column teaches self-referencing data.", slug: "nested-comments", status: "draft", tags: ["sql"] },
      { title: "RSS Notes", body: "Feeds are generated from published posts.", slug: "rss-notes", status: "published", tags: ["rss"] }
    ],
    highlights: ["rich text editor dependency wiring", "HTML sanitization boundary", "nested comment model notes", "RSS and slug generation"]
  },
  {
    slug: "08-kanban-board",
    title: "Kanban Board",
    language: "ts",
    port: 4108,
    database: "kanban_board_dev",
    feature: "cards",
    entity: "card",
    table: "cards",
    collection: "cards",
    dependencies: { zod: "^3.24.1", "@dnd-kit/core": "^6.3.1", "@dnd-kit/sortable": "^10.0.0" },
    schema: [
      ["title", "string", "Card title"],
      ["body", "text", "Card description"],
      ["lane", "string", "todo"],
      ["status", "string", "todo"],
      ["tags", "json", ["product"]]
    ],
    seed: [
      { title: "Map board schema", body: "Boards own lists, lists own cards.", lane: "todo", status: "todo", tags: ["schema"] },
      { title: "Fractional ordering", body: "Store position values between neighbors.", lane: "doing", status: "in_progress", tags: ["ordering"] },
      { title: "Share board link", body: "Generate read-only sharing tokens.", lane: "done", status: "done", tags: ["sharing"] }
    ],
    highlights: ["drag-and-drop dependency wiring", "optimistic reorder flow", "fractional indexing", "nested board/list/card state"]
  },
  {
    slug: "09-job-application-tracker",
    title: "Job Application Tracker",
    language: "ts",
    port: 4109,
    database: "job_tracker_dev",
    feature: "applications",
    entity: "application",
    table: "applications",
    collection: "applications",
    dependencies: { zod: "^3.24.1", multer: "^1.4.5-lts.1", nodemailer: "^6.9.16", "date-fns": "^4.1.0" },
    schema: [
      ["company", "string", "Company"],
      ["role", "string", "Role"],
      ["stage", "string", "applied"],
      ["status", "string", "active"],
      ["tags", "json", ["remote"]]
    ],
    seed: [
      { company: "Northwind", role: "Frontend Engineer", stage: "phone_screen", status: "active", tags: ["react"] },
      { company: "Contoso", role: "Full Stack SWE", stage: "interview", status: "active", tags: ["node"] },
      { company: "Fabrikam", role: "Junior Developer", stage: "rejected", status: "closed", tags: ["practice"] }
    ],
    highlights: ["pipeline state machine", "resume upload wiring", "transactional stage history", "dashboard KPI queries"]
  },
  {
    slug: "10-inventory-management",
    title: "Inventory Management",
    language: "ts",
    port: 4110,
    database: "inventory_management_dev",
    feature: "products",
    entity: "product",
    table: "products",
    collection: "products",
    dependencies: { zod: "^3.24.1" },
    schema: [
      ["sku", "string", "SKU-001"],
      ["name", "string", "Product"],
      ["category", "string", "General"],
      ["status", "string", "active"],
      ["tags", "json", ["stocked"]]
    ],
    seed: [
      { sku: "HD-001", name: "Standing Desk", category: "Furniture", status: "active", tags: ["low-stock"] },
      { sku: "KB-101", name: "Mechanical Keyboard", category: "Electronics", status: "active", tags: ["fast-moving"] },
      { sku: "MN-220", name: "Monitor Arm", category: "Accessories", status: "active", tags: ["audit"] }
    ],
    highlights: ["stock movement audit trail", "purchase and sales order concepts", "Knex transactions", "SQL report patterns"]
  }
];

const root = process.cwd();

/** Creates a file and parent directories for generated project scaffolds. */
async function writeProjectFile(project, relativePath, content) {
  const filePath = path.join(root, project.slug, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content);
}

/** Returns the file extension used by the project's source language. */
function ext(project) {
  return project.language === "ts" ? "ts" : "js";
}

/** Returns the React extension used by the project's source language. */
function reactExt(project) {
  return project.language === "ts" ? "tsx" : "jsx";
}

/** Formats JSON with stable two-space indentation. */
function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/** Builds a package manifest for a generated client. */
function clientPackage(project) {
  const deps = {
    "@vitejs/plugin-react": "^4.3.4",
    vite: "^6.0.7",
    react: "^18.3.1",
    "react-dom": "^18.3.1",
    axios: "^1.7.9",
    ...project.dependencies
  };

  return json({
    name: `${project.slug}-client`,
    private: true,
    version: "0.1.0",
    type: "module",
    scripts: project.language === "ts"
      ? { dev: "vite --host 0.0.0.0", build: "tsc -b && vite build", preview: "vite preview --host 0.0.0.0" }
      : { dev: "vite --host 0.0.0.0", build: "vite build", preview: "vite preview --host 0.0.0.0" },
    dependencies: deps,
    devDependencies: project.language === "ts" ? { typescript: "^5.7.2" } : {}
  });
}

/** Builds a package manifest for a generated server. */
function serverPackage(project) {
  const deps = {
    express: "^4.21.2",
    knex: "^3.1.0",
    pg: "^8.13.1",
    cors: "^2.8.5",
    dotenv: "^16.4.7",
    helmet: "^8.0.0",
    morgan: "^1.10.0",
    ...project.dependencies
  };

  return json({
    name: `${project.slug}-server`,
    version: "0.1.0",
    type: project.language === "ts" ? "module" : "commonjs",
    scripts: project.language === "ts"
      ? { dev: "tsx watch src/server.ts", build: "tsc -p tsconfig.json", start: "node dist/server.js", migrate: "knex --knexfile knexfile.ts migrate:latest", seed: "knex --knexfile knexfile.ts seed:run" }
      : { dev: "node --watch src/server.js", start: "node src/server.js", migrate: "knex migrate:latest", seed: "knex seed:run" },
    dependencies: deps,
    devDependencies: project.language === "ts" ? { "@types/cors": "^2.8.17", "@types/express": "^4.17.21", "@types/morgan": "^1.9.9", "@types/node": "^22.10.2", tsx: "^4.19.2", typescript: "^5.7.2" } : {}
  });
}

/** Creates a concise README describing how to run and study the project. */
function readme(project) {
  return `# ${project.title}\n\nSelf-contained Tier 1 full-stack app for the corrected curriculum.\n\n## Run Locally\n\n1. Create a PostgreSQL database named \`${project.database}\`.\n2. Copy \`.env.example\` to \`.env\` and adjust credentials.\n3. Install dependencies in both apps:\n\n\`\`\`bash\nnpm --prefix server install\nnpm --prefix client install\nnpm --prefix server run migrate\nnpm --prefix server run seed\nnpm --prefix server run dev\nnpm --prefix client run dev\n\`\`\`\n\nServer: \`http://localhost:${project.port}\`\nClient: \`http://localhost:5173\`\n\n## Learning Focus\n\n${project.highlights.map((item) => `- ${item}`).join("\n")}\n\n## API Overview\n\n- \`GET /api/${project.collection}\` lists records with optional \`search\` and \`status\` filters.\n- \`GET /api/${project.collection}/stats\` returns dashboard counts.\n- \`GET /api/${project.collection}/:id\` returns one record.\n- \`POST /api/${project.collection}\` creates a record.\n- \`PUT /api/${project.collection}/:id\` updates a record.\n- \`DELETE /api/${project.collection}/:id\` deletes a record.\n\n## Notes\n\nThis project is intentionally educational: controllers stay thin, services hold validation and business rules, models own Knex queries, and responses use the standard success/error envelope.\n`;
}

/** Creates an architecture walkthrough for the generated project. */
function architecture(project) {
  return `# ${project.title} Architecture\n\n## Folder Structure\n\n- \`client/\`: Vite React UI using CSS Modules.\n- \`server/\`: Express API with controller/service/model layers.\n- \`server/db/migrations/\`: reversible PostgreSQL schema.\n- \`server/db/seeds/\`: realistic development data.\n\n## Request Flow\n\nA request enters \`routes\`, the controller extracts params/body, the service validates and applies business rules, the model runs Knex queries, and the controller returns \`{ success: true, data }\`.\n\n## Database Shape\n\nThe main learning table is \`${project.table}\`. It includes timestamps plus these domain fields:\n\n${project.schema.map(([name, type]) => `- \`${name}\`: ${type}`).join("\n")}\n\n## Design Decisions\n\n- Keep one main domain workflow per generated project so the architecture is easy to inspect.\n- Include migration and seed data so SQL behavior can be studied before the UI is touched.\n- Preserve the Tier 1 conventions across all projects so each new app adds concepts without changing the mental model.\n\n## Review Prompts\n\n- Which code belongs in controllers, services, and models?\n- Which validation belongs on the client, and which must be repeated on the server?\n- How would this schema change when adding authentication or multi-user ownership?\n`;
}

/** Builds shared environment examples. */
function envExample(project) {
  return `NODE_ENV=development\nPORT=${project.port}\nCLIENT_ORIGIN=http://localhost:5173\nDB_HOST=localhost\nDB_PORT=5432\nDB_NAME=${project.database}\nDB_USER=postgres\nDB_PASSWORD=postgres\nDB_SSL=false\n`;
}

/** Generates a Vite config for JavaScript or TypeScript projects. */
function viteConfig(project) {
  const quote = project.language === "ts" ? '"' : "'";
  return `import { defineConfig } from ${quote}vite${quote};\nimport react from ${quote}@vitejs/plugin-react${quote};\n\nexport default defineConfig({\n  plugins: [react()],\n  server: { port: 5173 }\n});\n`;
}

/** Generates a basic TypeScript config. */
function tsconfig() {
  return json({
    compilerOptions: {
      target: "ES2022",
      useDefineForClassFields: true,
      lib: ["DOM", "DOM.Iterable", "ES2022"],
      allowJs: false,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: false,
      forceConsistentCasingInFileNames: true,
      module: "ESNext",
      moduleResolution: "Node",
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: "react-jsx"
    },
    include: ["src"]
  });
}

/** Generates the client API service. */
function clientApi(project) {
  const ts = project.language === "ts";
  return `import axios from "axios";\n\nconst api = axios.create({\n  baseURL: import.meta.env.VITE_API_URL || "http://localhost:${project.port}/api",\n  headers: { "Content-Type": "application/json" }\n});\n\n/** Reads the standard API response envelope. */\nfunction unwrap${ts ? "<T>" : ""}(response${ts ? ": { data: { success: boolean; data?: T; error?: { message: string } } }" : ""})${ts ? ": T" : ""} {\n  if (!response.data.success) {\n    throw new Error(response.data.error?.message || "Request failed");\n  }\n\n  return response.data.data${ts ? " as T" : ""};\n}\n\n/** Lists ${project.collection} for the workspace screen. */\nexport async function listRecords(filters = {}) {\n  const response = await api.get("/${project.collection}", { params: filters });\n  return unwrap(response);\n}\n\n/** Creates a new ${project.entity}. */\nexport async function createRecord(payload) {\n  const response = await api.post("/${project.collection}", payload);\n  return unwrap(response);\n}\n\n/** Updates an existing ${project.entity}. */\nexport async function updateRecord(id, payload) {\n  const response = await api.put(\`/${project.collection}/\${id}\`, payload);\n  return unwrap(response);\n}\n\n/** Deletes an existing ${project.entity}. */\nexport async function deleteRecord(id) {\n  const response = await api.delete(\`/${project.collection}/\${id}\`);\n  return unwrap(response);\n}\n\n/** Loads aggregate dashboard stats. */\nexport async function loadStats() {\n  const response = await api.get("/${project.collection}/stats");\n  return unwrap(response);\n}\n`;
}

/** Generates the main React app. */
function clientApp(project) {
  const ts = project.language === "ts";
  const textField = project.schema.find(([name]) => ["title", "company", "sku"].includes(name))?.[0] || project.schema[0][0];
  const secondField = project.schema.find(([name]) => !["tags", "status"].includes(name) && name !== textField)?.[0] || "status";
  return `import { useEffect, useMemo, useState } from "react";\nimport "./index.css";\nimport styles from "./App.module.css";\nimport { createRecord, deleteRecord, listRecords, loadStats, updateRecord } from "./services/api";\n\nconst emptyForm = ${JSON.stringify(Object.fromEntries(project.schema.map(([key,, sample]) => [key, sample])), null, 2)};\n\n/** Renders the complete ${project.title} learning UI. */\nexport default function App() {\n  const [records, setRecords] = useState${ts ? "<any[]>" : ""}([]);\n  const [stats, setStats] = useState${ts ? "<any>" : ""}(null);\n  const [form, setForm] = useState(emptyForm);\n  const [editingId, setEditingId] = useState${ts ? "<number | null>" : ""}(null);\n  const [search, setSearch] = useState("");\n  const [error, setError] = useState("");\n\n  const filteredRecords = useMemo(() => {\n    return records.filter((record) => JSON.stringify(record).toLowerCase().includes(search.toLowerCase()));\n  }, [records, search]);\n\n  /** Refreshes list and stats from the API. */\n  async function refresh() {\n    try {\n      const [nextRecords, nextStats] = await Promise.all([listRecords(), loadStats()]);\n      setRecords(nextRecords);\n      setStats(nextStats);\n      setError("");\n    } catch (requestError) {\n      setError(requestError instanceof Error ? requestError.message : "Could not load records");\n    }\n  }\n\n  useEffect(() => {\n    refresh();\n  }, []);\n\n  /** Updates form state for text inputs. */\n  function updateField(field, value) {\n    setForm((current) => ({ ...current, [field]: field === "tags" ? value.split(",").map((tag) => tag.trim()).filter(Boolean) : value }));\n  }\n\n  /** Creates or updates a record through the API. */\n  async function saveRecord(event) {\n    event.preventDefault();\n    try {\n      if (editingId) {\n        await updateRecord(editingId, form);\n      } else {\n        await createRecord(form);\n      }\n      setForm(emptyForm);\n      setEditingId(null);\n      await refresh();\n    } catch (requestError) {\n      setError(requestError instanceof Error ? requestError.message : "Could not save record");\n    }\n  }\n\n  /** Loads a record into the form for editing. */\n  function editRecord(record) {\n    setEditingId(record.id);\n    setForm({ ...emptyForm, ...record });\n  }\n\n  /** Deletes a record after a browser confirmation. */\n  async function removeRecord(id) {\n    if (!window.confirm("Delete this record?")) return;\n    await deleteRecord(id);\n    await refresh();\n  }\n\n  return (\n    <main className={styles.shell}>\n      <section className={styles.header}>\n        <div>\n          <p>{stats?.total ?? records.length} records</p>\n          <h1>${project.title}</h1>\n        </div>\n        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" />\n      </section>\n\n      {error && <div className={styles.error}>{error}</div>}\n\n      <section className={styles.grid}>\n        <form className={styles.panel} onSubmit={saveRecord}>\n          <h2>{editingId ? "Edit" : "Create"} ${project.entity}</h2>\n          ${project.schema.map(([field]) => `<label>\n            ${field.replace(/_/g, " ")}\n            <input value={Array.isArray(form.${field}) ? form.${field}.join(", ") : form.${field} ?? ""} onChange={(event) => updateField("${field}", event.target.value)} />\n          </label>`).join("\n          ")}\n          <button>{editingId ? "Update" : "Create"}</button>\n        </form>\n\n        <section className={styles.list}>\n          {filteredRecords.map((record) => (\n            <article className={styles.card} key={record.id}>\n              <div>\n                <h3>{record.${textField}}</h3>\n                <p>{record.${secondField}}</p>\n                <small>{record.status || "active"}</small>\n              </div>\n              <div className={styles.actions}>\n                <button onClick={() => editRecord(record)}>Edit</button>\n                <button onClick={() => removeRecord(record.id)}>Delete</button>\n              </div>\n            </article>\n          ))}\n        </section>\n      </section>\n    </main>\n  );\n}\n`;
}

/** Generates CSS for the React client. */
function appCss() {
  return `.shell { min-height: 100vh; padding: 32px; background: #f7f7fb; color: #202230; }\n.header { display: flex; justify-content: space-between; gap: 16px; align-items: center; margin-bottom: 24px; }\n.header h1 { margin: 0; font-size: 32px; }\n.header p { margin: 0 0 4px; color: #62677a; }\n.header input, .panel input { border: 1px solid #d8dbea; border-radius: 8px; padding: 10px 12px; font: inherit; }\n.grid { display: grid; grid-template-columns: minmax(260px, 360px) 1fr; gap: 20px; align-items: start; }\n.panel, .card { background: #fff; border: 1px solid #e4e6f0; border-radius: 8px; box-shadow: 0 10px 24px rgba(20, 24, 40, 0.06); }\n.panel { display: grid; gap: 12px; padding: 18px; }\n.panel h2 { margin: 0; }\n.panel label { display: grid; gap: 6px; color: #45495f; text-transform: capitalize; }\n.panel button, .actions button { border: 0; border-radius: 8px; padding: 10px 12px; background: #2454d6; color: white; cursor: pointer; }\n.list { display: grid; gap: 12px; }\n.card { display: flex; justify-content: space-between; gap: 16px; padding: 16px; }\n.card h3 { margin: 0 0 6px; }\n.card p { margin: 0 0 8px; color: #51566d; }\n.card small { color: #71768b; }\n.actions { display: flex; gap: 8px; align-items: start; }\n.actions button:last-child { background: #c53232; }\n.error { padding: 12px 14px; margin-bottom: 16px; border-radius: 8px; background: #fff1f1; color: #9f1d1d; }\n@media (max-width: 760px) { .shell { padding: 18px; } .header, .card { flex-direction: column; align-items: stretch; } .grid { grid-template-columns: 1fr; } }\n`;
}

/** Generates backend environment config. */
function serverEnv(project) {
  const ts = project.language === "ts";
  return `import dotenv from "dotenv";\n\ndotenv.config({ path: "../.env" });\n\n/** Reads and validates runtime configuration once at startup. */\nexport function getEnv() {\n  return {\n    port: Number(process.env.PORT || ${project.port}),\n    clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",\n    database: {\n      host: process.env.DB_HOST || "localhost",\n      port: Number(process.env.DB_PORT || 5432),\n      database: process.env.DB_NAME || "${project.database}",\n      user: process.env.DB_USER || "postgres",\n      password: process.env.DB_PASSWORD || "postgres",\n      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false\n    }\n  }${ts ? " as const" : ""};\n}\n\nexport const env = getEnv();\n`;
}

/** Converts ESM config to CommonJS for JavaScript projects. */
function cjsEnv(project) {
  return `const dotenv = require("dotenv");\n\ndotenv.config({ path: "../.env" });\n\n/** Reads and validates runtime configuration once at startup. */\nfunction getEnv() {\n  return {\n    port: Number(process.env.PORT || ${project.port}),\n    clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",\n    database: {\n      host: process.env.DB_HOST || "localhost",\n      port: Number(process.env.DB_PORT || 5432),\n      database: process.env.DB_NAME || "${project.database}",\n      user: process.env.DB_USER || "postgres",\n      password: process.env.DB_PASSWORD || "postgres",\n      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false\n    }\n  };\n}\n\nmodule.exports = { env: getEnv(), getEnv };\n`;
}

/** Generates Knex database connection. */
function dbFile(project) {
  if (project.language === "ts") {
    return `import knex from "knex";\nimport { env } from "./env";\n\n/** Shared Knex instance for model functions. */\nexport const db = knex({ client: "pg", connection: env.database, pool: { min: 0, max: 10 } });\n`;
  }
  return `const knex = require("knex");\nconst { env } = require("./env");\n\n/** Shared Knex instance for model functions. */\nconst db = knex({ client: "pg", connection: env.database, pool: { min: 0, max: 10 } });\n\nmodule.exports = { db };\n`;
}

/** Generates the project knexfile. */
function knexfile(project) {
  if (project.language === "ts") {
    return `import type { Knex } from "knex";\nimport { env } from "./src/config/env";\n\nconst config: Record<string, Knex.Config> = {\n  development: {\n    client: "pg",\n    connection: env.database,\n    migrations: { directory: "./db/migrations", extension: "ts" },\n    seeds: { directory: "./db/seeds", extension: "ts" }\n  }\n};\n\nexport default config;\n`;
  }
  return `const { env } = require("./src/config/env");\n\nmodule.exports = {\n  development: {\n    client: "pg",\n    connection: env.database,\n    migrations: { directory: "./db/migrations" },\n    seeds: { directory: "./db/seeds" }\n  }\n};\n`;
}

/** Generates migration code for one main table. */
function migration(project) {
  const cols = project.schema.map(([name, type]) => {
    if (type === "text") return `    table.text("${name}");`;
    if (type === "json") return `    table.jsonb("${name}").notNullable().defaultTo("[]");`;
    return `    table.string("${name}", 255).notNullable();`;
  }).join("\n");

  if (project.language === "ts") {
    return `import type { Knex } from "knex";\n\nexport async function up(knex: Knex): Promise<void> {\n  await knex.schema.createTable("${project.table}", (table) => {\n    table.increments("id").primary();\n${cols}\n    table.timestamps(true, true);\n  });\n}\n\nexport async function down(knex: Knex): Promise<void> {\n  await knex.schema.dropTableIfExists("${project.table}");\n}\n`;
  }
  return `exports.up = async function up(knex) {\n  await knex.schema.createTable("${project.table}", (table) => {\n    table.increments("id").primary();\n${cols}\n    table.timestamps(true, true);\n  });\n};\n\nexports.down = async function down(knex) {\n  await knex.schema.dropTableIfExists("${project.table}");\n};\n`;
}

/** Generates seed data. */
function seed(project) {
  const data = JSON.stringify(project.seed, null, 2);
  if (project.language === "ts") {
    return `import type { Knex } from "knex";\n\nexport async function seed(knex: Knex): Promise<void> {\n  await knex("${project.table}").del();\n  await knex("${project.table}").insert(${data});\n}\n`;
  }
  return `exports.seed = async function seed(knex) {\n  await knex("${project.table}").del();\n  await knex("${project.table}").insert(${data});\n};\n`;
}

/** Generates error and response helpers. */
function helpers(project) {
  if (project.language === "ts") {
    return {
      "src/utils/errors.ts": `export class AppError extends Error { constructor(message: string, public statusCode = 500, public code = "APP_ERROR") { super(message); } }\nexport class NotFoundError extends AppError { constructor(message = "Not found") { super(message, 404, "NOT_FOUND"); } }\nexport class ValidationError extends AppError { constructor(message = "Invalid request") { super(message, 400, "VALIDATION_ERROR"); } }\n`,
      "src/utils/response.ts": `import type { Response } from "express";\n\n/** Sends the standard success envelope. */\nexport function sendSuccess(res: Response, data: unknown, status = 200) { return res.status(status).json({ success: true, data }); }\n`,
      "src/middleware/errorMiddleware.ts": `import type { NextFunction, Request, Response } from "express";\nimport { AppError } from "../utils/errors";\n\n/** Converts thrown errors into the standard error envelope. */\nexport function errorMiddleware(error: Error, _req: Request, res: Response, _next: NextFunction) { const appError = error instanceof AppError ? error : new AppError(error.message); return res.status(appError.statusCode).json({ success: false, error: { message: appError.message, code: appError.code } }); }\n\n/** Handles unmatched routes. */\nexport function notFoundMiddleware(_req: Request, res: Response) { return res.status(404).json({ success: false, error: { message: "Route not found", code: "NOT_FOUND" } }); }\n`
    };
  }
  return {
    "src/utils/errors.js": `class AppError extends Error { constructor(message, statusCode = 500, code = "APP_ERROR") { super(message); this.statusCode = statusCode; this.code = code; } }\nclass NotFoundError extends AppError { constructor(message = "Not found") { super(message, 404, "NOT_FOUND"); } }\nclass ValidationError extends AppError { constructor(message = "Invalid request") { super(message, 400, "VALIDATION_ERROR"); } }\nmodule.exports = { AppError, NotFoundError, ValidationError };\n`,
    "src/utils/response.js": `/** Sends the standard success envelope. */\nfunction sendSuccess(res, data, status = 200) { return res.status(status).json({ success: true, data }); }\nmodule.exports = { sendSuccess };\n`,
    "src/middleware/errorMiddleware.js": `const { AppError } = require("../utils/errors");\n\n/** Converts thrown errors into the standard error envelope. */\nfunction errorMiddleware(error, _req, res, _next) { const appError = error instanceof AppError ? error : new AppError(error.message); return res.status(appError.statusCode).json({ success: false, error: { message: appError.message, code: appError.code } }); }\n\n/** Handles unmatched routes. */\nfunction notFoundMiddleware(_req, res) { return res.status(404).json({ success: false, error: { message: "Route not found", code: "NOT_FOUND" } }); }\nmodule.exports = { errorMiddleware, notFoundMiddleware };\n`
  };
}

/** Generates model/service/controller/routes/app/server files. */
function serverFiles(project) {
  if (project.language === "ts") {
    return {
      "src/models/model.ts": `import { db } from "../config/db";\n\n/** Lists records with basic search filters. */\nexport function listRecords(query: { search?: string; status?: string }) { const builder = db("${project.table}").select("*").orderBy("created_at", "desc"); if (query.status) builder.where("status", query.status); if (query.search) builder.whereRaw("CAST(${project.table} AS TEXT) ILIKE ?", [\`%\${query.search}%\`]); return builder; }\n/** Finds one record by id. */\nexport function findRecord(id: number) { return db("${project.table}").where({ id }).first(); }\n/** Creates one record. */\nexport async function createRecord(payload: Record<string, unknown>) { const [row] = await db("${project.table}").insert(payload).returning("*"); return row; }\n/** Updates one record. */\nexport async function updateRecord(id: number, payload: Record<string, unknown>) { const [row] = await db("${project.table}").where({ id }).update({ ...payload, updated_at: db.fn.now() }).returning("*"); return row; }\n/** Deletes one record. */\nexport async function deleteRecord(id: number) { const [row] = await db("${project.table}").where({ id }).del().returning("*"); return row; }\n/** Counts records for dashboard stats. */\nexport async function stats() { const rows = await db("${project.table}").select("status").count({ count: "*" }).groupBy("status"); return { total: rows.reduce((sum, row) => sum + Number(row.count), 0), byStatus: rows }; }\n`,
      "src/services/service.ts": `import * as model from "../models/model";\nimport { NotFoundError, ValidationError } from "../utils/errors";\n\n/** Parses route ids before they reach the data layer. */\nfunction parseId(value: string) { const id = Number(value); if (!Number.isInteger(id) || id < 1) throw new ValidationError("Id must be a positive integer."); return id; }\n/** Sanitizes incoming payloads to the known domain fields. */\nfunction sanitizePayload(payload: Record<string, unknown>) { const allowed = ${JSON.stringify(project.schema.map(([name]) => name))}; const clean: Record<string, unknown> = {}; for (const key of allowed) if (payload[key] !== undefined) clean[key] = payload[key]; if (Object.keys(clean).length === 0) throw new ValidationError("At least one field is required."); return clean; }\n/** Lists records using trusted query values. */\nexport function list(query: { search?: string; status?: string }) { return model.listRecords(query); }\n/** Gets one record or throws a 404. */\nexport async function get(idValue: string) { const record = await model.findRecord(parseId(idValue)); if (!record) throw new NotFoundError("${project.entity} not found."); return record; }\n/** Creates one record. */\nexport function create(payload: Record<string, unknown>) { return model.createRecord(sanitizePayload(payload)); }\n/** Updates one record. */\nexport async function update(idValue: string, payload: Record<string, unknown>) { await get(idValue); return model.updateRecord(parseId(idValue), sanitizePayload(payload)); }\n/** Deletes one record. */\nexport async function remove(idValue: string) { await get(idValue); return model.deleteRecord(parseId(idValue)); }\n/** Returns aggregate stats. */\nexport function getStats() { return model.stats(); }\n`,
      "src/controllers/controller.ts": `import type { Request, Response } from "express";\nimport * as service from "../services/service";\nimport { sendSuccess } from "../utils/response";\n\n/** Handles list requests. */\nexport async function list(req: Request, res: Response) { return sendSuccess(res, await service.list(req.query as { search?: string; status?: string })); }\n/** Handles detail requests. */\nexport async function get(req: Request, res: Response) { return sendSuccess(res, await service.get(req.params.id)); }\n/** Handles create requests. */\nexport async function create(req: Request, res: Response) { return sendSuccess(res, await service.create(req.body), 201); }\n/** Handles update requests. */\nexport async function update(req: Request, res: Response) { return sendSuccess(res, await service.update(req.params.id, req.body)); }\n/** Handles delete requests. */\nexport async function remove(req: Request, res: Response) { return sendSuccess(res, await service.remove(req.params.id)); }\n/** Handles stats requests. */\nexport async function stats(req: Request, res: Response) { return sendSuccess(res, await service.getStats()); }\n`,
      "src/routes/routes.ts": `import { Router } from "express";\nimport * as controller from "../controllers/controller";\n\nconst router = Router();\nconst wrap = (handler: any) => (req: any, res: any, next: any) => Promise.resolve(handler(req, res, next)).catch(next);\nrouter.get("/", wrap(controller.list));\nrouter.get("/stats", wrap(controller.stats));\nrouter.get("/:id", wrap(controller.get));\nrouter.post("/", wrap(controller.create));\nrouter.put("/:id", wrap(controller.update));\nrouter.delete("/:id", wrap(controller.remove));\nexport default router;\n`,
      "src/app.ts": `import cors from "cors";\nimport express from "express";\nimport helmet from "helmet";\nimport morgan from "morgan";\nimport { env } from "./config/env";\nimport routes from "./routes/routes";\nimport { errorMiddleware, notFoundMiddleware } from "./middleware/errorMiddleware";\n\nconst app = express();\napp.use(helmet());\napp.use(cors({ origin: env.clientOrigin, credentials: true }));\napp.use(morgan("dev"));\napp.use(express.json());\napp.get("/health", (_req, res) => res.json({ success: true, data: { service: "${project.slug}", status: "ok" } }));\napp.use("/api/${project.collection}", routes);\napp.use(notFoundMiddleware);\napp.use(errorMiddleware);\nexport default app;\n`,
      "src/server.ts": `import app from "./app";\nimport { env } from "./config/env";\n\n/** Starts the HTTP server for local learning. */\napp.listen(env.port, () => console.log("${project.title} API listening on " + env.port));\n`
    };
  }

  return {
    "src/models/model.js": `const { db } = require("../config/db");\n\n/** Lists records with basic search filters. */\nfunction listRecords(query) { const builder = db("${project.table}").select("*").orderBy("created_at", "desc"); if (query.status) builder.where("status", query.status); if (query.search) builder.whereRaw("CAST(${project.table} AS TEXT) ILIKE ?", [\`%\${query.search}%\`]); return builder; }\n/** Finds one record by id. */\nfunction findRecord(id) { return db("${project.table}").where({ id }).first(); }\n/** Creates one record. */\nasync function createRecord(payload) { const [row] = await db("${project.table}").insert(payload).returning("*"); return row; }\n/** Updates one record. */\nasync function updateRecord(id, payload) { const [row] = await db("${project.table}").where({ id }).update({ ...payload, updated_at: db.fn.now() }).returning("*"); return row; }\n/** Deletes one record. */\nasync function deleteRecord(id) { const [row] = await db("${project.table}").where({ id }).del().returning("*"); return row; }\n/** Counts records for dashboard stats. */\nasync function stats() { const rows = await db("${project.table}").select("status").count({ count: "*" }).groupBy("status"); return { total: rows.reduce((sum, row) => sum + Number(row.count), 0), byStatus: rows }; }\nmodule.exports = { listRecords, findRecord, createRecord, updateRecord, deleteRecord, stats };\n`,
    "src/services/service.js": `const model = require("../models/model");\nconst { NotFoundError, ValidationError } = require("../utils/errors");\nfunction parseId(value) { const id = Number(value); if (!Number.isInteger(id) || id < 1) throw new ValidationError("Id must be a positive integer."); return id; }\nfunction sanitizePayload(payload) { const allowed = ${JSON.stringify(project.schema.map(([name]) => name))}; const clean = {}; for (const key of allowed) if (payload[key] !== undefined) clean[key] = payload[key]; if (Object.keys(clean).length === 0) throw new ValidationError("At least one field is required."); return clean; }\n/** Lists records using trusted query values. */\nfunction list(query) { return model.listRecords(query); }\n/** Gets one record or throws a 404. */\nasync function get(idValue) { const record = await model.findRecord(parseId(idValue)); if (!record) throw new NotFoundError("${project.entity} not found."); return record; }\n/** Creates one record. */\nfunction create(payload) { return model.createRecord(sanitizePayload(payload)); }\n/** Updates one record. */\nasync function update(idValue, payload) { await get(idValue); return model.updateRecord(parseId(idValue), sanitizePayload(payload)); }\n/** Deletes one record. */\nasync function remove(idValue) { await get(idValue); return model.deleteRecord(parseId(idValue)); }\n/** Returns aggregate stats. */\nfunction getStats() { return model.stats(); }\nmodule.exports = { list, get, create, update, remove, getStats };\n`,
    "src/controllers/controller.js": `const service = require("../services/service");\nconst { sendSuccess } = require("../utils/response");\n/** Handles list requests. */\nasync function list(req, res) { return sendSuccess(res, await service.list(req.query)); }\n/** Handles detail requests. */\nasync function get(req, res) { return sendSuccess(res, await service.get(req.params.id)); }\n/** Handles create requests. */\nasync function create(req, res) { return sendSuccess(res, await service.create(req.body), 201); }\n/** Handles update requests. */\nasync function update(req, res) { return sendSuccess(res, await service.update(req.params.id, req.body)); }\n/** Handles delete requests. */\nasync function remove(req, res) { return sendSuccess(res, await service.remove(req.params.id)); }\n/** Handles stats requests. */\nasync function stats(req, res) { return sendSuccess(res, await service.getStats()); }\nmodule.exports = { list, get, create, update, remove, stats };\n`,
    "src/routes/routes.js": `const { Router } = require("express");\nconst controller = require("../controllers/controller");\nconst router = Router();\nconst wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);\nrouter.get("/", wrap(controller.list));\nrouter.get("/stats", wrap(controller.stats));\nrouter.get("/:id", wrap(controller.get));\nrouter.post("/", wrap(controller.create));\nrouter.put("/:id", wrap(controller.update));\nrouter.delete("/:id", wrap(controller.remove));\nmodule.exports = router;\n`,
    "src/app.js": `const cors = require("cors");\nconst express = require("express");\nconst helmet = require("helmet");\nconst morgan = require("morgan");\nconst { env } = require("./config/env");\nconst routes = require("./routes/routes");\nconst { errorMiddleware, notFoundMiddleware } = require("./middleware/errorMiddleware");\nconst app = express();\napp.use(helmet());\napp.use(cors({ origin: env.clientOrigin, credentials: true }));\napp.use(morgan("dev"));\napp.use(express.json());\napp.get("/health", (_req, res) => res.json({ success: true, data: { service: "${project.slug}", status: "ok" } }));\napp.use("/api/${project.collection}", routes);\napp.use(notFoundMiddleware);\napp.use(errorMiddleware);\nmodule.exports = app;\n`,
    "src/server.js": `const app = require("./app");\nconst { env } = require("./config/env");\n/** Starts the HTTP server for local learning. */\napp.listen(env.port, () => console.log("${project.title} API listening on " + env.port));\n`
  };
}

/** Generates every file for one missing Tier 1 project. */
async function generateProject(project) {
  await writeProjectFile(project, ".env.example", envExample(project));
  await writeProjectFile(project, "README.md", readme(project));
  await writeProjectFile(project, "docs/architecture.md", architecture(project));
  await writeProjectFile(project, "client/package.json", clientPackage(project));
  await writeProjectFile(project, "client/index.html", `<div id="root"></div><script type="module" src="/src/main.${reactExt(project)}"></script>\n`);
  await writeProjectFile(project, `client/vite.config.${ext(project)}`, viteConfig(project));
  await writeProjectFile(project, "client/src/index.css", `* { box-sizing: border-box; } body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }\n`);
  await writeProjectFile(project, "client/src/App.module.css", appCss());
  await writeProjectFile(project, `client/src/services/api.${ext(project)}`, clientApi(project));
  await writeProjectFile(project, `client/src/main.${reactExt(project)}`, `import React from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./App";\n\ncreateRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);\n`.replace("!", project.language === "ts" ? "!" : ""));
  await writeProjectFile(project, `client/src/App.${reactExt(project)}`, clientApp(project));
  if (project.language === "ts") {
    await writeProjectFile(project, "client/tsconfig.json", tsconfig());
    await writeProjectFile(project, "client/src/vite-env.d.ts", `/// <reference types="vite/client" />\n\ndeclare module "*.module.css" {\n  const classes: Record<string, string>;\n  export default classes;\n}\n`);
  }

  await writeProjectFile(project, "server/package.json", serverPackage(project));
  await writeProjectFile(project, `server/knexfile.${ext(project)}`, knexfile(project));
  await writeProjectFile(project, `server/src/config/env.${ext(project)}`, project.language === "ts" ? serverEnv(project) : cjsEnv(project));
  await writeProjectFile(project, `server/src/config/db.${ext(project)}`, dbFile(project));
  await writeProjectFile(project, `server/db/migrations/001_init.${ext(project)}`, migration(project));
  await writeProjectFile(project, `server/db/seeds/001_seed.${ext(project)}`, seed(project));
  if (project.language === "ts") {
    await writeProjectFile(project, "server/tsconfig.json", json({ compilerOptions: { target: "ES2022", module: "ESNext", moduleResolution: "Node", outDir: "dist", rootDir: ".", strict: false, esModuleInterop: true, skipLibCheck: true }, include: ["src", "knexfile.ts", "db/**/*.ts"] }));
  }

  const helperFiles = helpers(project);
  for (const [file, content] of Object.entries(helperFiles)) {
    await writeProjectFile(project, `server/${file}`, content);
  }

  const generatedServerFiles = serverFiles(project);
  for (const [file, content] of Object.entries(generatedServerFiles)) {
    await writeProjectFile(project, `server/${file}`, content);
  }
}

for (const project of projects) {
  await generateProject(project);
  console.log(`Generated ${project.slug}`);
}
