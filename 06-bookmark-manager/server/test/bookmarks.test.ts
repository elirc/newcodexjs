import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import helper from "./database.cjs";
helper.configure();
// One disposable schema and one HTTP server for the whole file: the harness destroys the
// Knex pool in its cleanup, so a per-test schema would leave later tests without a connection.
let db: any, http: any, cleanup: () => Promise<void>;
before(async () => {
  db = (await import("../src/config/db.js")).db;
  const { up } = await import("../db/migrations/001_init.js");
  const app = (await import("../src/app.js")).default;
  cleanup = await helper.prepare(db, up);
  http = await helper.listen(app);
});
after(async () => {
  if (http) await http.close();
  if (cleanup) await cleanup();
});
test("bookmark validation and metadata denial leave the stored record intact", async (t) => {
  const payload = {
    title: "A guide",
    url: "https://example.com/guide",
    collection: "Learning",
    status: "active",
    tags: ["JS", "JS"],
  };
  let result = await http.request("POST", "/api/bookmarks", payload);
  assert.equal(result.status, 201);
  const id = result.body.data.id;
  assert.deepEqual(result.body.data.tags, ["JS"]);
  for (const change of [
    { url: "javascript:alert(1)" },
    { title: 42 },
    { tags: "JS" },
    { url: "https://user:password@example.com" },
  ]) {
    result = await http.request("POST", "/api/bookmarks", {
      ...payload,
      ...change,
    });
    assert.equal(result.status, 400);
  }
  result = await http.request("PUT", `/api/bookmarks/${id}`, {
    title: "Updated",
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.data.url, payload.url);
  result = await http.request("PUT", `/api/bookmarks/${id}`, {
    url: "file:///private",
  });
  assert.equal(result.status, 400);
  assert.equal((await db("bookmarks").where({ id }).first()).title, "Updated");
  assert.equal((await db("bookmarks").select("*")).length, 1);
  assert.equal(
    (
      await http.request("POST", "/api/bookmarks/metadata", {
        url: "https://127.0.0.1/private",
      })
    ).status,
    400,
  );
  assert.equal(
    (await http.request("GET", "/api/bookmarks/2147483648")).status,
    400,
  );
});

test("search is bounded to title, url and collection and treats % and _ as characters", async (t) => {
  const made = await http.request("POST", "/api/bookmarks", { title: "Percent 100% guide", url: "https://example.com/pct", collection: "Learning", status: "active", tags: [] });
  assert.equal(made.status, 201);
  const id = made.body.data.id;
  let r = await http.request("GET", "/api/bookmarks?search=%");
  assert.equal(r.status, 200);
  assert.equal(r.body.data.filter((x: any) => x.title !== "Percent 100% guide").length, 0, "a bare % must not match every row");
  r = await http.request("GET", "/api/bookmarks?search=100%25");
  assert.equal(r.body.data.some((x: any) => x.id === id), true);
  r = await http.request("GET", "/api/bookmarks?search=" + String(id));
  assert.equal(r.body.data.some((x: any) => x.id === id), false, "ids are not searchable");
  r = await http.request("GET", "/api/bookmarks?search=" + encodeURIComponent(made.body.data.created_at.slice(0, 4)));
  assert.equal(r.body.data.some((x: any) => x.id === id), false, "timestamps are not searchable");
});
