import type { Knex } from "knex";

/** Creates the polling chat schema. */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("username", 50).notNullable().unique();
    table.string("email", 255).notNullable().unique();
    table.string("password_hash", 255).notNullable();
    table.string("display_name", 100).notNullable();
    table.string("avatar_url", 500);
    table.string("status", 20).notNullable().defaultTo("offline");
    table.timestamp("last_seen_at");
    table.timestamps(true, true);
    table.check("status in ('online', 'offline', 'away')");
  });
  await knex.schema.createTable("conversations", (table) => {
    table.increments("id").primary();
    table.string("type", 10).notNullable();
    table.string("name", 100);
    table.string("avatar_url", 500);
    table.integer("created_by").references("id").inTable("users");
    table.timestamp("last_message_at");
    table.timestamps(true, true);
    table.check("type in ('direct', 'group')");
  });
  await knex.schema.createTable("messages", (table) => {
    table.increments("id").primary();
    table.integer("conversation_id").notNullable().references("id").inTable("conversations").onDelete("CASCADE");
    table.integer("user_id").notNullable().references("id").inTable("users");
    table.text("content").notNullable();
    table.boolean("is_edited").notNullable().defaultTo(false);
    table.boolean("is_deleted").notNullable().defaultTo(false);
    table.timestamps(true, true);
    table.index(["conversation_id", "created_at"]);
  });
  await knex.schema.createTable("conversation_members", (table) => {
    table.integer("conversation_id").notNullable().references("id").inTable("conversations").onDelete("CASCADE");
    table.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("role", 20).notNullable().defaultTo("member");
    table.integer("last_read_message_id").references("id").inTable("messages");
    table.timestamp("joined_at").notNullable().defaultTo(knex.fn.now());
    table.primary(["conversation_id", "user_id"]);
    table.check("role in ('admin', 'member')");
  });
  await knex.schema.createTable("reactions", (table) => {
    table.increments("id").primary();
    table.integer("message_id").notNullable().references("id").inTable("messages").onDelete("CASCADE");
    table.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("emoji", 10).notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.unique(["message_id", "user_id", "emoji"]);
  });
  await knex.schema.createTable("typing_indicators", (table) => {
    table.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.integer("conversation_id").notNullable().references("id").inTable("conversations").onDelete("CASCADE");
    table.timestamp("started_at").notNullable().defaultTo(knex.fn.now());
    table.primary(["user_id", "conversation_id"]);
  });
}

/** Drops the polling chat schema. */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("typing_indicators");
  await knex.schema.dropTableIfExists("reactions");
  await knex.schema.dropTableIfExists("conversation_members");
  await knex.schema.dropTableIfExists("messages");
  await knex.schema.dropTableIfExists("conversations");
  await knex.schema.dropTableIfExists("users");
}

