import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("activity_events").del();
  await knex("listings").del();
  await knex("vendors").del();

  const [org] = await knex("vendors").insert({ name: "Demo vendor" }).returning("*");
  const records = await knex("listings").insert([
  {
    "title": "Modular Desk Kit",
    "status": "active",
    "priority": "featured",
    "owner": "Northwind Goods",
    "metadata": {
      "price": 249,
      "inventory": 14
    }
  },
  {
    "title": "Studio Light Pack",
    "status": "active",
    "priority": "medium",
    "owner": "Contoso Supply",
    "metadata": {
      "price": 129,
      "inventory": 42
    }
  },
  {
    "title": "Prototype Chair",
    "status": "draft",
    "priority": "low",
    "owner": "Fabrikam Studio",
    "metadata": {
      "price": 399,
      "inventory": 3
    }
  }
].map((record) => ({
    ...record,
    vendor_id: org.id
  }))).returning("*");

  await knex("activity_events").insert(records.map((record) => ({
    listing_id: record.id,
    event_type: "seeded",
    message: `Created demo record: ${record.title}`,
    payload: { status: record.status, priority: record.priority }
  })));
}
