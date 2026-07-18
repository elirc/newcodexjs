import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("applications").del();
  await knex("applications").insert([
  {
    "company": "Northwind",
    "role": "Frontend Engineer",
    "stage": "phone_screen",
    "status": "active",
    "tags": [
      "react"
    ]
  },
  {
    "company": "Contoso",
    "role": "Full Stack SWE",
    "stage": "interview",
    "status": "active",
    "tags": [
      "node"
    ]
  },
  {
    "company": "Fabrikam",
    "role": "Junior Developer",
    "stage": "rejected",
    "status": "closed",
    "tags": [
      "practice"
    ]
  }
]);
}
