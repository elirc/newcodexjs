import type { Knex } from "knex";

/** Seeds users, categories, products, images, carts, orders, reviews, and addresses. */
export async function seed(knex: Knex): Promise<void> {
  await knex("wishlists").del();
  await knex("reviews").del();
  await knex("order_items").del();
  await knex("orders").del();
  await knex("addresses").del();
  await knex("cart_items").del();
  await knex("carts").del();
  await knex("product_images").del();
  await knex("products").del();
  await knex("categories").del();
  await knex("users").del();

  const users = await knex("users")
    .insert([
      { email: "admin@example.com", password_hash: "demo", display_name: "Admin User", role: "admin" },
      { email: "customer@example.com", password_hash: "demo", display_name: "Mira Customer", role: "customer" },
      { email: "shopper@example.com", password_hash: "demo", display_name: "Noah Shopper", role: "customer" }
    ])
    .returning("*");

  const categories = await knex("categories")
    .insert([
      { name: "Home", slug: "home", sort_order: 1 },
      { name: "Kitchen", slug: "kitchen", sort_order: 2 },
      { name: "Office", slug: "office", sort_order: 3 },
      { name: "Travel", slug: "travel", sort_order: 4 },
      { name: "Lighting", slug: "lighting", parent_id: 1, sort_order: 1 },
      { name: "Cookware", slug: "cookware", parent_id: 2, sort_order: 1 },
      { name: "Desk Gear", slug: "desk-gear", parent_id: 3, sort_order: 1 },
      { name: "Bags", slug: "bags", parent_id: 4, sort_order: 1 }
    ])
    .returning("*");

  const products = [];
  for (let index = 1; index <= 50; index += 1) {
    const category = categories[index % categories.length];
    products.push({
      name: `Everyday Product ${index}`,
      slug: `everyday-product-${index}`,
      description: `A practical product number ${index} with clear specs and dependable materials.`,
      short_description: `Useful daily item ${index}`,
      price: (12 + index * 3.15).toFixed(2),
      compare_at_price: index % 4 === 0 ? (18 + index * 3.5).toFixed(2) : null,
      cost_price: (7 + index * 1.5).toFixed(2),
      sku: `SKU-${String(index).padStart(4, "0")}`,
      category_id: category.id,
      stock_quantity: index % 9 === 0 ? 0 : 8 + index,
      avg_rating: ((index % 5) + 1).toFixed(1),
      review_count: index % 7,
      weight: (1 + index / 10).toFixed(2)
    });
  }
  const insertedProducts = await knex("products").insert(products).returning("*");
  await knex("product_images").insert(
    insertedProducts.flatMap((product, index) => [
      { product_id: product.id, url: `https://placehold.co/800x600?text=Product+${index + 1}`, alt_text: product.name, sort_order: 1, is_primary: true },
      { product_id: product.id, url: `https://placehold.co/800x600?text=Detail+${index + 1}`, alt_text: `${product.name} detail`, sort_order: 2, is_primary: false }
    ])
  );

  await knex("addresses").insert([
    { user_id: users[1].id, label: "Home", full_name: "Mira Customer", street_line_1: "100 Market St", city: "Portland", state: "OR", zip_code: "97201", country: "US", phone: "555-0100", is_default: true },
    { user_id: users[2].id, label: "Work", full_name: "Noah Shopper", street_line_1: "40 Pine Ave", city: "Austin", state: "TX", zip_code: "78701", country: "US", phone: "555-0101", is_default: true }
  ]);

  const orders = [];
  for (let index = 1; index <= 15; index += 1) {
    orders.push({
      order_number: `ORD-SEED-${index}`,
      user_id: index % 2 === 0 ? users[1].id : users[2].id,
      status: ["pending", "confirmed", "processing", "shipped", "delivered"][index % 5],
      subtotal: "89.00",
      shipping_cost: "5.99",
      tax_amount: "7.34",
      total: "102.33",
      shipping_address: { full_name: "Seed Customer", street_line_1: "100 Market St", city: "Portland", state: "OR", zip_code: "97201", country: "US" },
      shipping_method: index % 3 === 0 ? "express" : "standard",
      payment_method: "mock_card",
      payment_status: "paid"
    });
  }
  const insertedOrders = await knex("orders").insert(orders).returning("*");
  await knex("order_items").insert(
    insertedOrders.flatMap((order, index) => {
      const product = insertedProducts[index % insertedProducts.length];
      return [{ order_id: order.id, product_id: product.id, product_name: product.name, quantity: 1 + (index % 3), unit_price: product.price, line_total: Number(product.price) * (1 + (index % 3)) }];
    })
  );

  await knex("reviews").insert(
    insertedProducts.slice(0, 30).map((product, index) => ({
      product_id: product.id,
      user_id: index % 2 === 0 ? users[1].id : users[2].id,
      rating: (index % 5) + 1,
      title: `Review ${index + 1}`,
      content: "Helpful quality for the price.",
      is_verified_purchase: true
    }))
  );

  const [cart] = await knex("carts").insert({ user_id: users[1].id }).returning("*");
  await knex("cart_items").insert([
    { cart_id: cart.id, product_id: insertedProducts[0].id, quantity: 2, unit_price: insertedProducts[0].price },
    { cart_id: cart.id, product_id: insertedProducts[3].id, quantity: 1, unit_price: insertedProducts[3].price }
  ]);

  await knex("wishlists").insert([
    { user_id: users[1].id, product_id: insertedProducts[4].id },
    { user_id: users[1].id, product_id: insertedProducts[7].id }
  ]);
}

