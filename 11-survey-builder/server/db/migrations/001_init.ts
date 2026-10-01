import type { Knex } from "knex";

/** Creates the survey builder schema. */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("email", 255).notNullable().unique();
    table.string("display_name", 100).notNullable();
    table.timestamps(true, true);
  });
  await knex.schema.createTable("surveys", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("title", 255).notNullable();
    table.text("description");
    table.string("status", 20).notNullable().defaultTo("draft");
    table.string("public_token", 64).unique();
    table.string("access_code", 20);
    table.timestamp("start_date");
    table.timestamp("end_date");
    table.integer("max_responses");
    table.integer("response_count").notNullable().defaultTo(0);
    table.boolean("is_template").notNullable().defaultTo(false);
    table.timestamps(true, true);
    table.check("status in ('draft', 'active', 'closed')");
  });
  await knex.schema.createTable("questions", (table) => {
    table.increments("id").primary();
    table
      .integer("survey_id")
      .notNullable()
      .references("id")
      .inTable("surveys")
      .onDelete("CASCADE");
    table.string("question_type", 20).notNullable();
    table.string("title", 500).notNullable();
    table.text("description");
    table.boolean("is_required").notNullable().defaultTo(false);
    table.integer("sort_order").notNullable();
    table.jsonb("config");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.check(
      "question_type in ('short_text', 'long_text', 'single_choice', 'multi_choice', 'rating', 'yes_no', 'number', 'date', 'matrix')",
    );
  });
  await knex.schema.createTable("question_options", (table) => {
    table.increments("id").primary();
    table
      .integer("question_id")
      .notNullable()
      .references("id")
      .inTable("questions")
      .onDelete("CASCADE");
    table.string("label", 255).notNullable();
    table.integer("sort_order").notNullable();
  });
  await knex.schema.createTable("responses", (table) => {
    table.increments("id").primary();
    table
      .integer("survey_id")
      .notNullable()
      .references("id")
      .inTable("surveys")
      .onDelete("CASCADE");
    table.string("respondent_ip", 45);
    table.timestamp("started_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("completed_at");
  });
  await knex.schema.createTable("response_answers", (table) => {
    table.increments("id").primary();
    table
      .integer("response_id")
      .notNullable()
      .references("id")
      .inTable("responses")
      .onDelete("CASCADE");
    table
      .integer("question_id")
      .notNullable()
      .references("id")
      .inTable("questions")
      .onDelete("CASCADE");
    table.text("answer_text");
    table
      .integer("selected_option_id")
      .references("id")
      .inTable("question_options");
    table.specificType("selected_option_ids", "integer[]");
    table.integer("rating_value");
    table.jsonb("matrix_answers");
  });
}

/** Drops the survey builder schema in dependency order. */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("response_answers");
  await knex.schema.dropTableIfExists("responses");
  await knex.schema.dropTableIfExists("question_options");
  await knex.schema.dropTableIfExists("questions");
  await knex.schema.dropTableIfExists("surveys");
  await knex.schema.dropTableIfExists("users");
}
