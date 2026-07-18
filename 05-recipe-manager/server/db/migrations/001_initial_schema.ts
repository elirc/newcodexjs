import type { Knex } from 'knex';

/** Creates the recipe manager relational schema. */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('username', 50).notNullable().unique();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('display_name', 100);
    table.string('avatar_url', 500);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('recipes', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.text('description');
    table.string('image_url', 500);
    table.integer('prep_time_minutes').checkPositive();
    table.integer('cook_time_minutes').checkPositive();
    table.integer('servings').checkPositive();
    table.string('difficulty', 20).notNullable().defaultTo('medium');
    table.boolean('is_public').notNullable().defaultTo(true);
    table.timestamps(true, true);
    table.check("difficulty in ('easy', 'medium', 'hard')");
  });

  await knex.schema.createTable('ingredients', (table) => {
    table.increments('id').primary();
    table.integer('recipe_id').notNullable().references('id').inTable('recipes').onDelete('CASCADE');
    table.string('quantity', 50);
    table.string('unit', 30);
    table.string('name', 200).notNullable();
    table.integer('sort_order').notNullable();
  });

  await knex.schema.createTable('steps', (table) => {
    table.increments('id').primary();
    table.integer('recipe_id').notNullable().references('id').inTable('recipes').onDelete('CASCADE');
    table.integer('step_number').notNullable();
    table.text('instruction').notNullable();
    table.string('image_url', 500);
  });

  await knex.schema.createTable('categories', (table) => {
    table.increments('id').primary();
    table.string('name', 50).notNullable().unique();
    table.string('slug', 50).notNullable().unique();
  });

  await knex.schema.createTable('recipe_categories', (table) => {
    table.integer('recipe_id').notNullable().references('id').inTable('recipes').onDelete('CASCADE');
    table.integer('category_id').notNullable().references('id').inTable('categories').onDelete('CASCADE');
    table.primary(['recipe_id', 'category_id']);
  });

  await knex.schema.createTable('favorites', (table) => {
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('recipe_id').notNullable().references('id').inTable('recipes').onDelete('CASCADE');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.primary(['user_id', 'recipe_id']);
  });

  await knex.schema.createTable('refresh_tokens', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token_hash', 255).notNullable();
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
}

/** Drops the recipe manager schema in dependency order. */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('refresh_tokens');
  await knex.schema.dropTableIfExists('favorites');
  await knex.schema.dropTableIfExists('recipe_categories');
  await knex.schema.dropTableIfExists('categories');
  await knex.schema.dropTableIfExists('steps');
  await knex.schema.dropTableIfExists('ingredients');
  await knex.schema.dropTableIfExists('recipes');
  await knex.schema.dropTableIfExists('users');
}
