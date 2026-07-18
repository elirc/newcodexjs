import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("products").del();
  await knex("products").insert([
  {
    "sku": "HD-001",
    "name": "Standing Desk",
    "category": "Furniture",
    "status": "active",
    "tags": [
      "low-stock"
    ]
  },
  {
    "sku": "KB-101",
    "name": "Mechanical Keyboard",
    "category": "Electronics",
    "status": "active",
    "tags": [
      "fast-moving"
    ]
  },
  {
    "sku": "MN-220",
    "name": "Monitor Arm",
    "category": "Accessories",
    "status": "active",
    "tags": [
      "audit"
    ]
  }
]);
}
