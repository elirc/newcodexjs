import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("bookmarks").del();
  await knex("bookmarks").insert([
  {
    "title": "Knex Guide",
    "url": "https://knexjs.org",
    "collection": "Backend",
    "status": "active",
    "tags": [
      "sql",
      "knex"
    ]
  },
  {
    "title": "MDN Web Docs",
    "url": "https://developer.mozilla.org",
    "collection": "Frontend",
    "status": "active",
    "tags": [
      "reference"
    ]
  },
  {
    "title": "Old Vendor Link",
    "url": "https://example.com/vendor",
    "collection": "Archive",
    "status": "archived",
    "tags": [
      "archive"
    ]
  }
].map((bookmark) => ({ ...bookmark, tags: JSON.stringify(bookmark.tags) })));
}
