import type { Knex } from "knex";

/** Creates all API tester tables with reversible foreign keys and checks. */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("name", 150).notNullable();
    table.string("email", 255).notNullable().unique();
    table.timestamps(true, true);
  });

  await knex.schema.createTable("environments", (table) => {
    table.increments("id").primary();
    table.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("name", 100).notNullable();
    table.boolean("is_active").notNullable().defaultTo(false);
    table.timestamps(true, true);
    table.unique(["user_id", "name"]);
  });

  await knex.schema.createTable("env_variables", (table) => {
    table.increments("id").primary();
    table.integer("environment_id").notNullable().references("id").inTable("environments").onDelete("CASCADE");
    table.string("key", 100).notNullable();
    table.text("value").notNullable();
    table.boolean("is_secret").notNullable().defaultTo(false);
    table.integer("sort_order").notNullable().defaultTo(0);
    table.unique(["environment_id", "key"]);
  });

  await knex.schema.createTable("collections", (table) => {
    table.increments("id").primary();
    table.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("name", 100).notNullable();
    table.text("description");
    table.integer("sort_order").notNullable().defaultTo(0);
    table.timestamps(true, true);
  });

  await knex.schema.createTable("folders", (table) => {
    table.increments("id").primary();
    table.integer("collection_id").notNullable().references("id").inTable("collections").onDelete("CASCADE");
    table.string("name", 100).notNullable();
    table.integer("sort_order").notNullable().defaultTo(0);
  });

  await knex.schema.createTable("saved_requests", (table) => {
    table.increments("id").primary();
    table.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.integer("collection_id").references("id").inTable("collections").onDelete("CASCADE");
    table.integer("folder_id").references("id").inTable("folders").onDelete("CASCADE");
    table.string("name", 200).notNullable();
    table.string("method", 10).notNullable().defaultTo("GET");
    table.text("url").notNullable();
    table.jsonb("headers").notNullable().defaultTo(knex.raw("'[]'::jsonb"));
    table.jsonb("params").notNullable().defaultTo(knex.raw("'[]'::jsonb"));
    table.string("body_type", 20);
    table.text("body_content");
    table.string("auth_type", 20);
    table.jsonb("auth_config");
    table.integer("sort_order").notNullable().defaultTo(0);
    table.timestamps(true, true);
  });

  await knex.schema.createTable("request_history", (table) => {
    table.increments("id").primary();
    table.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("method", 10).notNullable();
    table.text("url").notNullable();
    table.jsonb("request_headers");
    table.text("request_body");
    table.integer("response_status");
    table.jsonb("response_headers");
    table.text("response_body");
    table.integer("response_size_bytes");
    table.integer("response_time_ms");
    table.text("error_message");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw("alter table saved_requests add constraint saved_requests_method_check check (method in ('GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS'))");
  await knex.raw("alter table saved_requests add constraint saved_requests_body_type_check check (body_type is null or body_type in ('json','form-data','raw','none'))");
  await knex.raw("alter table saved_requests add constraint saved_requests_auth_type_check check (auth_type is null or auth_type in ('none','bearer','basic'))");
  await knex.raw("create index request_history_user_created_idx on request_history (user_id, created_at desc)");
}

/** Drops API tester tables in dependency order. */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("request_history");
  await knex.schema.dropTableIfExists("saved_requests");
  await knex.schema.dropTableIfExists("folders");
  await knex.schema.dropTableIfExists("collections");
  await knex.schema.dropTableIfExists("env_variables");
  await knex.schema.dropTableIfExists("environments");
  await knex.schema.dropTableIfExists("users");
}
