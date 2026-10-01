/** Adds the expression index the search predicate in models/model.js can use. */
exports.up = async function up(knex) {
  await knex.raw(
    "CREATE INDEX IF NOT EXISTS notes_search_idx ON notes USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, '')))",
  );
};
exports.down = async function down(knex) {
  await knex.raw("DROP INDEX IF EXISTS notes_search_idx");
};
