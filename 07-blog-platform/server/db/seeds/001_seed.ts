import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("posts").del();
  await knex("posts").insert([
  {
    "title": "Designing REST APIs",
    "body": "Thin controllers keep route handlers boring.",
    "slug": "designing-rest-apis",
    "status": "published",
    "tags": [
      "api"
    ]
  },
  {
    "title": "Nested Comments",
    "body": "A parent_id column teaches self-referencing data.",
    "slug": "nested-comments",
    "status": "draft",
    "tags": [
      "sql"
    ]
  },
  {
    "title": "RSS Notes",
    "body": "Feeds are generated from published posts.",
    "slug": "rss-notes",
    "status": "published",
    "tags": [
      "rss"
    ]
  }
]);
}
