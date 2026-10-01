import type { Knex } from "knex";

/** Creates the storefront schema. */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("email", 255).notNullable().unique();
    table.string("password_hash", 255).notNullable();
    table.string("display_name", 100).notNullable();
    table.string("role", 20).notNullable().defaultTo("customer");
    table.timestamps(true, true);
    table.check("role in ('customer', 'admin')");
  });
  await knex.schema.createTable("categories", (table) => {
    table.increments("id").primary();
    table.string("name", 100).notNullable();
    table.string("slug", 100).notNullable().unique();
    table.integer("parent_id").references("id").inTable("categories");
    table.string("image_url", 500);
    table.integer("sort_order").notNullable().defaultTo(0);
  });
  await knex.schema.createTable("products", (table) => {
    table.increments("id").primary();
    table.string("name", 255).notNullable();
    table.string("slug", 300).notNullable().unique();
    table.text("description");
    table.string("short_description", 500);
    table.decimal("price", 10, 2).notNullable();
    table.decimal("compare_at_price", 10, 2);
    table.decimal("cost_price", 10, 2);
    table.string("sku", 50).notNullable().unique();
    table.integer("category_id").references("id").inTable("categories");
    table.integer("stock_quantity").notNullable().defaultTo(0);
    table.boolean("is_active").notNullable().defaultTo(true);
    table.decimal("avg_rating", 2, 1).notNullable().defaultTo(0);
    table.integer("review_count").notNullable().defaultTo(0);
    table.decimal("weight", 8, 2);
    table.timestamps(true, true);
  });
  await knex.schema.createTable("product_images", (table) => {
    table.increments("id").primary();
    table
      .integer("product_id")
      .notNullable()
      .references("id")
      .inTable("products")
      .onDelete("CASCADE");
    table.string("url", 500).notNullable();
    table.string("alt_text", 200);
    table.integer("sort_order").notNullable().defaultTo(0);
    table.boolean("is_primary").notNullable().defaultTo(false);
  });
  await knex.schema.createTable("carts", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE")
      .unique();
    table.string("session_id", 100).unique();
    table.timestamps(true, true);
  });
  await knex.schema.createTable("cart_items", (table) => {
    table.increments("id").primary();
    table
      .integer("cart_id")
      .notNullable()
      .references("id")
      .inTable("carts")
      .onDelete("CASCADE");
    table
      .integer("product_id")
      .notNullable()
      .references("id")
      .inTable("products");
    table.integer("quantity").notNullable();
    table.decimal("unit_price", 10, 2).notNullable();
    table.unique(["cart_id", "product_id"]);
    table.check("quantity > 0");
  });
  await knex.schema.createTable("addresses", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("label", 50);
    table.string("full_name", 200).notNullable();
    table.string("street_line_1", 255).notNullable();
    table.string("street_line_2", 255);
    table.string("city", 100).notNullable();
    table.string("state", 100).notNullable();
    table.string("zip_code", 20).notNullable();
    table.string("country", 100).notNullable().defaultTo("US");
    table.string("phone", 30);
    table.boolean("is_default").notNullable().defaultTo(false);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });
  await knex.schema.createTable("orders", (table) => {
    table.increments("id").primary();
    table.string("order_number", 20).notNullable().unique();
    table.integer("user_id").notNullable().references("id").inTable("users");
    table.string("status", 20).notNullable().defaultTo("pending");
    table.decimal("subtotal", 10, 2).notNullable();
    table.decimal("shipping_cost", 10, 2).notNullable().defaultTo(0);
    table.decimal("tax_amount", 10, 2).notNullable().defaultTo(0);
    table.decimal("total", 10, 2).notNullable();
    table.jsonb("shipping_address").notNullable();
    table.string("shipping_method", 50).notNullable();
    table.string("payment_method", 20).notNullable().defaultTo("mock_card");
    table.string("payment_status", 20).notNullable().defaultTo("paid");
    table.text("notes");
    table.timestamps(true, true);
    table.check(
      "status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')",
    );
  });
  await knex.schema.createTable("order_items", (table) => {
    table.increments("id").primary();
    table
      .integer("order_id")
      .notNullable()
      .references("id")
      .inTable("orders")
      .onDelete("CASCADE");
    table
      .integer("product_id")
      .notNullable()
      .references("id")
      .inTable("products");
    table.string("product_name", 255).notNullable();
    table.integer("quantity").notNullable();
    table.decimal("unit_price", 10, 2).notNullable();
    table.decimal("line_total", 10, 2).notNullable();
  });
  await knex.schema.createTable("reviews", (table) => {
    table.increments("id").primary();
    table
      .integer("product_id")
      .notNullable()
      .references("id")
      .inTable("products")
      .onDelete("CASCADE");
    table
      .integer("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.integer("rating").notNullable();
    table.string("title", 200);
    table.text("content");
    table.boolean("is_verified_purchase").notNullable().defaultTo(false);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.unique(["product_id", "user_id"]);
    table.check("rating between 1 and 5");
  });
  await knex.schema.createTable("wishlists", (table) => {
    table
      .integer("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("product_id")
      .notNullable()
      .references("id")
      .inTable("products")
      .onDelete("CASCADE");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.primary(["user_id", "product_id"]);
  });
}

/** Drops the storefront schema in dependency order. */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("wishlists");
  await knex.schema.dropTableIfExists("reviews");
  await knex.schema.dropTableIfExists("order_items");
  await knex.schema.dropTableIfExists("orders");
  await knex.schema.dropTableIfExists("addresses");
  await knex.schema.dropTableIfExists("cart_items");
  await knex.schema.dropTableIfExists("carts");
  await knex.schema.dropTableIfExists("product_images");
  await knex.schema.dropTableIfExists("products");
  await knex.schema.dropTableIfExists("categories");
  await knex.schema.dropTableIfExists("users");
}
