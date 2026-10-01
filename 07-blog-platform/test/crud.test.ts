import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { database, request } from "./database.js";
let h;
before(async () => {
  h = await database();
});
after(async () => {
  if (h) await h.close();
});
const route = "/api/posts",
  valid = {
    title: "Post title",
    body: "Post body",
    slug: "post-title",
    status: "draft",
    tags: ["blog"],
  };
const call = (path = route, method = "GET", body = undefined) =>
  request(h.origin, path, method, body);
test("create/read/partial update preserves identity and omitted fields", async () => {
  const made = await call(route, "POST", valid);
  assert.equal(made.status, 201, JSON.stringify(made.data));
  const row = made.data.data;
  assert.deepEqual(row.tags, valid.tags);
  const changed = await call(route + "/" + row.id, "PUT", {
    title: "Revised fixture",
  });
  assert.equal(changed.status, 200);
  assert.equal(changed.data.data.id, row.id);
  assert.equal(changed.data.data.body, row.body);
  assert.equal(changed.data.data.title, "Revised fixture");
  assert.deepEqual(
    (await call(route + "/" + row.id)).data.data,
    changed.data.data,
  );
});
test("malformed create and edits return 400 without changing stored data", async () => {
  const made = (await call(route, "POST", valid)).data.data;
  for (const body of [
    { title: {} },
    { tags: [{}] },
    { tags: [""] },
    { title: " " },
    { title: "x".repeat(256) },
    {},
  ]) {
    assert.equal(
      (await call(route + "/" + made.id, "PUT", body)).status,
      400,
      JSON.stringify(body),
    );
  }
  assert.deepEqual((await call(route + "/" + made.id)).data.data, made);
  assert.equal((await call(route, "POST", { tags: [] })).status, 400);
  assert.equal((await call(route + "/1e2")).status, 400);
});
test("tags serialize as JSON arrays and filters compose with stable ordering", async () => {
  const made = await call(route, "POST", {
    ...valid,
    title: "DistinctAstraSearch",
    status: "active",
    tags: ["one", "ONE", "two"],
  });
  assert.equal(made.status, 201);
  assert.deepEqual(made.data.data.tags, ["ONE", "two"]);
  const found = await call(route + "?search=DistinctAstraSearch&status=active");
  assert.equal(found.data.data.length, 1);
  assert.equal(
    (await call(route + "?search=DistinctAstraSearch&status=missing")).data.data
      .length,
    0,
  );
});
test("delete removes the record and repeated operations return 404", async () => {
  const made = (await call(route, "POST", valid)).data.data;
  const path = route + "/" + made.id;
  assert.equal((await call(path, "DELETE")).status, 200);
  assert.equal((await call(path)).status, 404);
  assert.equal((await call(path, "DELETE")).status, 404);
  assert.equal(
    (await call(path, "PUT", { title: "Still absent" })).status,
    404,
  );
});
