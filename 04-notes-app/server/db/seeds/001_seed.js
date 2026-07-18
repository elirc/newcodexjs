exports.seed = async function seed(knex) {
  await knex("notes").del();
  await knex("notes").insert([
  {
    "title": "Markdown Cheatsheet",
    "body": "# Markdown\n\n- Lists\n- **Bold** text\n- Links",
    "folder": "Learning",
    "status": "active",
    "tags": [
      "markdown",
      "reference"
    ]
  },
  {
    "title": "Project Ideas",
    "body": "Build a tiny wiki, then add full-text search.",
    "folder": "Ideas",
    "status": "active",
    "tags": [
      "ideas"
    ]
  },
  {
    "title": "Archived Scratchpad",
    "body": "Old notes kept for history.",
    "folder": "Archive",
    "status": "archived",
    "tags": [
      "archive"
    ]
  }
]);
};
