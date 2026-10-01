const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const harness = require("./database.cjs");
harness.configure();
const db = require("../src/config/db");
const service = require("../src/services/contactService");
const app = require("../src/app");
const { csvToContacts, contactsToCsv } = require("../src/utils/csv");
let clean, api;
before(async () => {
  clean = await harness.prepare(
    db,
    require("../db/migrations/202607030201_create_contacts_tags").up,
  );
  api = await harness.listen(app);
});
after(async () => {
  if (api) await api.close();
  if (clean) await clean();
});
test("quoted commas, doubled quotes, multiline notes and CRLF round-trip with tags", async () => {
  const csv =
    'first_name,last_name,email,company,notes,tags\r\nAda,Lovelace,ada@example.com,"Labs, Inc.","Line one\nShe said ""hello""",Friend|Colleague';
  const result = await service.importContacts(csv);
  assert.equal(result.imported, 1);
  const contact = await service.getContact(result.contacts[0].id);
  assert.equal(contact.company, "Labs, Inc.");
  assert.equal(contact.notes, 'Line one\nShe said "hello"');
  assert.deepEqual(
    contact.tags.map((tag) => tag.name),
    ["Colleague", "Friend"],
  );
  assert.equal(csvToContacts(contactsToCsv([contact]))[0].notes, contact.notes);
});
test("malformed late record rejects the entire batch without saving the earlier valid contact", async () => {
  const before = Number((await db("contacts").count("* as n").first()).n);
  for (const csv of [
    "first_name,last_name\nGrace,Hopper\nInvalid",
    "first_name,last_name\nGrace,Hopper\n,Missing",
    'first_name,last_name\n"Unclosed,Hopper',
    "first_name,first_name,last_name\nA,B,C",
  ])
    await assert.rejects(() => service.importContacts(csv));
  assert.equal(
    Number((await db("contacts").count("* as n").first()).n),
    before,
  );
});
test("a late database uniqueness failure rolls back contacts, new tags and junctions", async () => {
  await assert.rejects(
    () =>
      service.importContacts(
        "first_name,last_name,email,tags\nFirst,Person,rollback@example.com,TemporaryTag\nSecond,Person,rollback@example.com,OtherTag",
      ),
    /no contacts were imported/,
  );
  assert.equal(
    (await db("contacts").where({ email: "rollback@example.com" })).length,
    0,
  );
  assert.equal(
    (await db("tags").whereIn("name", ["TemporaryTag", "OtherTag"])).length,
    0,
  );
});
test("equal-name contacts page deterministically and bad pagination is rejected", async () => {
  await service.importContacts(
    "first_name,last_name,company\nA,Tie,PageFixture\nB,Tie,PageFixture\nC,Tie,PageFixture",
  );
  const a = await service.listContacts({
    search: "PageFixture",
    page: 1,
    limit: 2,
  });
  const b = await service.listContacts({
    search: "PageFixture",
    page: 2,
    limit: 2,
  });
  assert.equal(a.pagination.total, 3);
  assert.equal(
    new Set([...a.contacts, ...b.contacts].map((x) => x.id)).size,
    3,
  );
  await assert.rejects(() => service.listContacts({ page: "nope" }));
  await assert.rejects(() => service.listContacts({ limit: 1.5 }));
});

test("POST /api/contacts/import answers 200 for a good CSV and 400 for a malformed one, through the controller", async () => {
  const good = await api.request("POST", "/api/contacts/import", {
    csv: "first_name,last_name,email\r\nGrace,Hopper,grace@example.com",
  });
  assert.equal(good.status, 200, JSON.stringify(good.body));
  assert.equal(good.body.data.imported, 1);
  const before = Number((await db("contacts").count("* as n").first()).n);
  const bad = await api.request("POST", "/api/contacts/import", {
    csv: 'first_name,last_name,email\r\nAda,Lovelace,"unterminated',
  });
  assert.equal(bad.status, 400, JSON.stringify(bad.body));
  assert.equal(Number((await db("contacts").count("* as n").first()).n), before);
});
