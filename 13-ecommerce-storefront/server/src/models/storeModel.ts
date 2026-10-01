import type { Knex } from "knex";
import { db } from "../config/db.js";

/** Lists active products using dynamic filter clauses. */
export async function listProducts(filters: Record<string, any>) {
  const query = db("products")
    .where("products.is_active", true)
    .leftJoin("product_images", function joinPrimary() {
      this.on("product_images.product_id", "products.id").andOn(
        "product_images.is_primary",
        db.raw("true"),
      );
    });
  if (filters.category_id)
    query.where("products.category_id", filters.category_id);
  if (filters.min_price) query.where("products.price", ">=", filters.min_price);
  if (filters.max_price) query.where("products.price", "<=", filters.max_price);
  if (filters.min_rating)
    query.where("products.avg_rating", ">=", filters.min_rating);
  if (filters.in_stock === "true")
    query.where("products.stock_quantity", ">", 0);
  const countQuery = query
    .clone()
    .clearSelect()
    .clearOrder()
    .countDistinct<{ count: string }>("products.id as count")
    .first();
  const sort = filters.sort ?? "newest";
  if (sort === "price_asc") query.orderBy("products.price", "asc");
  else if (sort === "price_desc") query.orderBy("products.price", "desc");
  else if (sort === "rating") query.orderBy("products.avg_rating", "desc");
  else query.orderBy("products.created_at", "desc");
  const products = await query
    .select(
      "products.*",
      db.raw(
        "jsonb_build_array(jsonb_build_object('id', product_images.id, 'url', product_images.url, 'alt_text', product_images.alt_text, 'is_primary', product_images.is_primary)) as images",
      ),
    )
    .groupBy("products.id", "product_images.id")
    .limit(Number(filters.limit ?? 24))
    .offset(Number(filters.offset ?? 0));
  const total = Number((await countQuery)?.count ?? 0);
  return { products, total };
}

/** Loads one product detail by slug. */
export async function getProductBySlug(slug: string) {
  const product = await db("products").where({ slug, is_active: true }).first();
  if (!product) return null;
  const images = await db("product_images")
    .where({ product_id: product.id })
    .orderBy("sort_order");
  const reviews = await db("reviews")
    .join("users", "users.id", "reviews.user_id")
    .where("reviews.product_id", product.id)
    .select("reviews.*", "users.display_name");
  const related = await db("products")
    .where({ category_id: product.category_id, is_active: true })
    .whereNot({ id: product.id })
    .limit(4);
  return { ...product, images, reviews, related };
}

/** Lists categories ordered for navigation. */
export function listCategories() {
  return db("categories").orderBy(["parent_id", "sort_order", "name"]);
}

/** Gets or creates a cart by user or guest session. */
export async function getOrCreateCart(
  userId: number | null,
  sessionId: string | null,
  trx: Knex | Knex.Transaction = db,
) {
  const where = userId ? { user_id: userId } : { session_id: sessionId };
  let cart = await trx("carts").where(where).first();
  if (!cart) {
    await trx("carts")
      .insert(where)
      .onConflict(userId ? "user_id" : "session_id")
      .ignore();
    cart = await trx("carts").where(where).first();
  }
  return cart;
}

/** Lists cart items with products. */
export async function getCartItems(
  cartId: number,
  trx: Knex | Knex.Transaction = db,
) {
  return trx("cart_items")
    .join("products", "products.id", "cart_items.product_id")
    .where("cart_items.cart_id", cartId)
    .select("cart_items.*", db.raw("to_jsonb(products.*) as product"));
}

/** Upserts a cart item quantity. */
export async function upsertCartItem(
  cartId: number,
  productId: number,
  quantity: number,
  unitPrice: number,
) {
  return db("cart_items")
    .insert({
      cart_id: cartId,
      product_id: productId,
      quantity,
      unit_price: unitPrice,
    })
    .onConflict(["cart_id", "product_id"])
    .merge({
      quantity: db.raw("cart_items.quantity + excluded.quantity"),
      unit_price: unitPrice,
    });
}

/** Updates a cart item quantity. */
export function updateCartItem(
  cartId: number,
  productId: number,
  quantity: number,
) {
  return db("cart_items")
    .where({ cart_id: cartId, product_id: productId })
    .update({ quantity });
}

/** Deletes a cart item. */
export function deleteCartItem(cartId: number, productId: number) {
  return db("cart_items")
    .where({ cart_id: cartId, product_id: productId })
    .delete();
}

/** Lists addresses for a user. */
export function listAddresses(userId: number) {
  return db("addresses")
    .where({ user_id: userId })
    .orderBy("is_default", "desc");
}

/** Creates a user address. */
export function createAddress(userId: number, data: Record<string, unknown>) {
  return db("addresses")
    .insert({ ...data, user_id: userId })
    .returning("*")
    .then((rows) => rows[0]);
}

/** Lists orders for a user. */
export function listOrders(userId: number) {
  return db("orders").where({ user_id: userId }).orderBy("created_at", "desc");
}

/** Lists order detail with items. */
export async function getOrder(id: number, userId: number) {
  const order = await db("orders").where({ id, user_id: userId }).first();
  if (!order) return null;
  const items = await db("order_items").where({ order_id: id });
  return { ...order, items };
}

/** Inserts or removes wishlist entries. */
export const wishlist = {
  list: (userId: number) =>
    db("wishlists")
      .join("products", "products.id", "wishlists.product_id")
      .where("wishlists.user_id", userId)
      .select("products.*"),
  add: (userId: number, productId: number) =>
    db("wishlists")
      .insert({ user_id: userId, product_id: productId })
      .onConflict(["user_id", "product_id"])
      .ignore(),
  remove: (userId: number, productId: number) =>
    db("wishlists").where({ user_id: userId, product_id: productId }).delete(),
};

/** Lists all products for admin. */
export function adminProducts() {
  return db("products").orderBy("created_at", "desc");
}

/** Creates an admin product. */
export function createProduct(data: Record<string, unknown>) {
  return db("products")
    .insert(data)
    .returning("*")
    .then((rows) => rows[0]);
}

/** Updates an admin product. */
export function updateProduct(id: number, data: Record<string, unknown>) {
  return db("products")
    .where({ id })
    .update({ ...data, updated_at: db.fn.now() })
    .returning("*")
    .then((rows) => rows[0]);
}

/** Lists all orders for admin. */
export function adminOrders() {
  return db("orders").orderBy("created_at", "desc");
}
