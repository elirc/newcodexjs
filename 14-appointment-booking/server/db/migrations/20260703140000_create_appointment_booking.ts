import type { Knex } from "knex";

/** Creates all appointment booking tables with reversible constraints. */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("name", 150).notNullable();
    table.string("email", 255).notNullable().unique();
    table.string("role", 20).notNullable().defaultTo("customer");
    table.timestamps(true, true);
  });

  await knex.schema.createTable("provider_profiles", (table) => {
    table.increments("id").primary();
    table.integer("user_id").notNullable().unique().references("id").inTable("users").onDelete("CASCADE");
    table.string("specialty", 100);
    table.text("bio");
    table.string("timezone", 50).notNullable().defaultTo("America/New_York");
    table.integer("booking_buffer_minutes").notNullable().defaultTo(15);
    table.integer("advance_booking_days").notNullable().defaultTo(30);
    table.integer("cancellation_hours").notNullable().defaultTo(24);
    table.boolean("is_accepting_bookings").notNullable().defaultTo(true);
    table.timestamps(true, true);
  });

  await knex.schema.createTable("services", (table) => {
    table.increments("id").primary();
    table.integer("provider_id").notNullable().references("id").inTable("provider_profiles").onDelete("CASCADE");
    table.string("name", 200).notNullable();
    table.text("description");
    table.integer("duration_minutes").notNullable();
    table.decimal("price", 10, 2).notNullable();
    table.boolean("is_active").notNullable().defaultTo(true);
    table.integer("sort_order").notNullable().defaultTo(0);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("availability", (table) => {
    table.increments("id").primary();
    table.integer("provider_id").notNullable().references("id").inTable("provider_profiles").onDelete("CASCADE");
    table.integer("day_of_week").notNullable();
    table.time("start_time").notNullable();
    table.time("end_time").notNullable();
    table.unique(["provider_id", "day_of_week", "start_time"]);
  });

  await knex.schema.createTable("availability_overrides", (table) => {
    table.increments("id").primary();
    table.integer("provider_id").notNullable().references("id").inTable("provider_profiles").onDelete("CASCADE");
    table.date("override_date").notNullable();
    table.boolean("is_unavailable").notNullable().defaultTo(true);
    table.time("start_time");
    table.time("end_time");
    table.string("reason", 200);
    table.unique(["provider_id", "override_date"]);
  });

  await knex.schema.createTable("appointments", (table) => {
    table.increments("id").primary();
    table.integer("provider_id").notNullable().references("id").inTable("provider_profiles");
    table.integer("customer_id").notNullable().references("id").inTable("users");
    table.integer("service_id").notNullable().references("id").inTable("services");
    table.timestamp("start_time", { useTz: true }).notNullable();
    table.timestamp("end_time", { useTz: true }).notNullable();
    table.string("status", 30).notNullable().defaultTo("confirmed");
    table.text("notes");
    table.text("cancellation_reason");
    table.decimal("price", 10, 2).notNullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable("notifications", (table) => {
    table.increments("id").primary();
    table.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.integer("appointment_id").references("id").inTable("appointments").onDelete("SET NULL");
    table.string("type", 30).notNullable();
    table.string("subject", 200).notNullable();
    table.text("body").notNullable();
    table.boolean("is_read").notNullable().defaultTo(false);
    table.timestamp("sent_at");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw("alter table users add constraint users_role_check check (role in ('customer','provider','admin'))");
  await knex.raw("alter table services add constraint services_duration_check check (duration_minutes > 0)");
  await knex.raw("alter table services add constraint services_price_check check (price >= 0)");
  await knex.raw("alter table availability add constraint availability_day_check check (day_of_week between 0 and 6)");
  await knex.raw("alter table availability add constraint availability_range_check check (end_time > start_time)");
  await knex.raw("alter table appointments add constraint appointments_status_check check (status in ('confirmed','cancelled_by_customer','cancelled_by_provider','completed','no_show'))");
  await knex.raw("create index appointments_provider_time_idx on appointments (provider_id, start_time, end_time)");
}

/** Drops appointment booking tables in dependency order. */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("notifications");
  await knex.schema.dropTableIfExists("appointments");
  await knex.schema.dropTableIfExists("availability_overrides");
  await knex.schema.dropTableIfExists("availability");
  await knex.schema.dropTableIfExists("services");
  await knex.schema.dropTableIfExists("provider_profiles");
  await knex.schema.dropTableIfExists("users");
}
