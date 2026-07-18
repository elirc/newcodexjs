export async function up(knex) {
    await knex.schema.createTable("bookmarks", (table) => {
        table.increments("id").primary();
        table.string("title", 255).notNullable();
        table.string("url", 255).notNullable();
        table.string("collection", 255).notNullable();
        table.string("status", 255).notNullable();
        table.jsonb("tags").notNullable().defaultTo("[]");
        table.timestamps(true, true);
    });
}
export async function down(knex) {
    await knex.schema.dropTableIfExists("bookmarks");
}
