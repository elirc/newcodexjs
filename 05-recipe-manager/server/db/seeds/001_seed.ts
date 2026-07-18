import bcrypt from 'bcryptjs';
import type { Knex } from 'knex';

const categories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Appetizer', 'Beverage', 'Side Dish'];

/** Replaces development data with realistic users, categories, recipes, and favorites. */
export async function seed(knex: Knex): Promise<void> {
  await knex('refresh_tokens').del();
  await knex('favorites').del();
  await knex('recipe_categories').del();
  await knex('steps').del();
  await knex('ingredients').del();
  await knex('recipes').del();
  await knex('categories').del();
  await knex('users').del();

  const password_hash = await bcrypt.hash('password123', 10);
  const users = await knex('users')
    .insert([
      { username: 'maya', email: 'maya@example.com', display_name: 'Maya Chen', password_hash },
      { username: 'leo', email: 'leo@example.com', display_name: 'Leo Brooks', password_hash },
      { username: 'sam', email: 'sam@example.com', display_name: 'Sam Rivera', password_hash }
    ])
    .returning('*');

  const categoryRows = await knex('categories')
    .insert(categories.map((name) => ({ name, slug: name.toLowerCase().replaceAll(' ', '-') })))
    .returning('*');

  const titles = [
    'Citrus Herb Salmon', 'Weeknight Lentil Soup', 'Cardamom French Toast', 'Roasted Veggie Tacos',
    'Ginger Chicken Bowls', 'Blueberry Crumble Bars', 'Tomato Basil Pasta', 'Miso Mushroom Rice',
    'Peach Iced Tea', 'Crispy Chickpea Salad', 'Garlic Butter Shrimp', 'Sweet Potato Hash',
    'No-Knead Focaccia', 'Black Bean Chili', 'Lemon Yogurt Cake', 'Green Smoothie',
    'Sesame Noodle Salad', 'Turkey Lettuce Cups', 'Apple Cinnamon Oats', 'Herbed Potato Wedges'
  ];

  for (const [index, title] of titles.entries()) {
    const [recipe] = await knex('recipes')
      .insert({
        user_id: users[index % users.length].id,
        title,
        description: `${title} built for a realistic weeknight cooking demo.`,
        image_url: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80&sig=${index}`,
        prep_time_minutes: 10 + (index % 4) * 5,
        cook_time_minutes: 15 + (index % 5) * 8,
        servings: 2 + (index % 5),
        difficulty: ['easy', 'medium', 'hard'][index % 3],
        is_public: index % 7 !== 0
      })
      .returning('*');
    await knex('ingredients').insert([
      { recipe_id: recipe.id, quantity: '2', unit: 'cups', name: 'seasonal vegetables', sort_order: 1 },
      { recipe_id: recipe.id, quantity: '1', unit: 'tbsp', name: 'olive oil', sort_order: 2 },
      { recipe_id: recipe.id, quantity: '1/2', unit: 'tsp', name: 'kosher salt', sort_order: 3 }
    ]);
    await knex('steps').insert([
      { recipe_id: recipe.id, step_number: 1, instruction: 'Prep ingredients and heat the pan.' },
      { recipe_id: recipe.id, step_number: 2, instruction: 'Cook until fragrant and tender.' },
      { recipe_id: recipe.id, step_number: 3, instruction: 'Finish with herbs and serve warm.' }
    ]);
    await knex('recipe_categories').insert([
      { recipe_id: recipe.id, category_id: categoryRows[index % categoryRows.length].id },
      { recipe_id: recipe.id, category_id: categoryRows[(index + 2) % categoryRows.length].id }
    ]);
  }

  await knex('favorites').insert([
    { user_id: users[0].id, recipe_id: 2 },
    { user_id: users[0].id, recipe_id: 4 },
    { user_id: users[1].id, recipe_id: 1 },
    { user_id: users[2].id, recipe_id: 6 }
  ]);
}
