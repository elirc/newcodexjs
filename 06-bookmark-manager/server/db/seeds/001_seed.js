export async function seed(knex) {
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
    ]);
}
