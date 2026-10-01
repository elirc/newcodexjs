import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { database, request } from "./database.js";
let h: Awaited<ReturnType<typeof database>>;
before(async () => {
  h = await database();
  for (const id of [1, 2]) {
    await h.db("users").insert({
      id,
      email: `u${id}@example.com`,
      password_hash: "demo",
      display_name: "Learner",
    });
    await h.db("addresses").insert({
      id,
      user_id: id,
      full_name: "Learner",
      street_line_1: "1 Test St",
      city: "Test",
      state: "CA",
      zip_code: "00000",
    });
  }
});
after(async () => {
  if (h) await h.close();
});
const api = (path: string, method = "GET", body?: unknown, user = 1) =>
  request(h.origin, "/api" + path, method, body, {
    "x-demo-user-id": String(user),
  });
async function product(sku: string, stock: number) {
  return (
    await h
      .db("products")
      .insert({ name: sku, slug: sku, sku, price: 10, stock_quantity: stock })
      .returning("*")
  )[0];
}
async function checkout(user: number) {
  return api(
    "/checkout",
    "POST",
    { addressId: user, shippingMethod: "standard", paymentMethod: "mock_card" },
    user,
  );
}
test("cumulative additions and edits cannot exceed stock", async () => {
  const p = await product("bounds", 3);
  assert.equal(
    (await api("/cart/items", "POST", { productId: p.id, quantity: 2 })).status,
    201,
  );
  assert.equal(
    (await api("/cart/items", "POST", { productId: p.id, quantity: 2 })).status,
    400,
  );
  assert.equal(
    (await api(`/cart/items/${p.id}`, "PUT", { quantity: 4 })).status,
    400,
  );
  assert.equal(
    (await h.db("cart_items").where({ product_id: p.id }).first()).quantity,
    2,
  );
  await api(`/cart/items/${p.id}`, "DELETE");
});
test("two buyers cannot buy the same last unit", async () => {
  const p = await product("last", 1);
  for (const user of [1, 2])
    await api("/cart/items", "POST", { productId: p.id, quantity: 1 }, user);
  const result = await Promise.all([checkout(1), checkout(2)]);
  assert.deepEqual(
    result.map((r) => r.status).sort(),
    [201, 400],
    JSON.stringify(result),
  );
  assert.equal(
    (await h.db("products").where({ id: p.id }).first()).stock_quantity,
    0,
  );
  assert.equal(
    Number(
      (
        await h
          .db("order_items")
          .where({ product_id: p.id })
          .count("* as n")
          .first()
      ).n,
    ),
    1,
  );
  await h.db("cart_items").delete();
});
test("double checkout makes one order and late failure preserves cart and stock", async () => {
  const p = await product("rollback", 5);
  await api("/cart/items", "POST", { productId: p.id, quantity: 1 });
  await h.db.raw(
    `CREATE FUNCTION reject_order_item() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test failure'; END $$; CREATE TRIGGER reject_order_item BEFORE INSERT ON order_items FOR EACH ROW EXECUTE FUNCTION reject_order_item();`,
  );
  assert.equal((await checkout(1)).status, 500);
  assert.equal(
    (await h.db("products").where({ id: p.id }).first()).stock_quantity,
    5,
  );
  assert.ok(await h.db("cart_items").where({ product_id: p.id }).first());
  await h.db.raw("DROP TRIGGER reject_order_item ON order_items");
  const result = await Promise.all([checkout(1), checkout(1)]);
  assert.deepEqual(result.map((r) => r.status).sort(), [201, 400]);
  assert.equal(
    (await h.db("products").where({ id: p.id }).first()).stock_quantity,
    4,
  );
});
