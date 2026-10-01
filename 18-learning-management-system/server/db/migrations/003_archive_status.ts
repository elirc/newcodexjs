import type { Knex } from "knex";
export async function up(knex: Knex) {
  await knex.schema.alterTable("courses", (table) => {
    table.string("status_before_archive").nullable();
  });
}
export async function down(knex: Knex) {
  await knex.schema.alterTable("courses", (table) => {
    table.dropColumn("status_before_archive");
  });
}
