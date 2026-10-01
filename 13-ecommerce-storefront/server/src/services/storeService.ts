import { db } from "../config/db.js";
import { NotFoundError, ValidationError } from "../middleware/errors.js";
import * as store from "../models/storeModel.js";
import { orderNumber } from "../utils/http.js";

/** Builds a cart summary for either a user or a guest session. */
export async function getCart(userId: number | null, sessionId: string | null) {
  const cart = await store.getOrCreateCart(userId, sessionId);
  const items = await store.getCartItems(cart.id);
  return {
    ...cart,
    items,
    subtotal: items.reduce(
      (sum: number, item: any) => sum + Number(item.unit_price) * item.quantity,
      0,
    ),
  };
}

/** Adds a product to the current cart. */
export async function addToCart(
  userId: number | null,
  sessionId: string | null,
  productId: number,
  quantity: number,
) {
  await changeCartQuantity(userId, sessionId, productId, quantity, true);
  return getCart(userId, sessionId);
}

/** Updates a cart item without allowing its quantity to exceed available stock. */
export async function updateCartItem(
  userId: number | null,
  sessionId: string | null,
  productId: number,
  quantity: number,
) {
  await changeCartQuantity(userId, sessionId, productId, quantity, false);
  return getCart(userId, sessionId);
}

async function changeCartQuantity(
  userId: number | null,
  sessionId: string | null,
  productId: number,
  quantity: number,
  add: boolean,
) {
  if (!Number.isSafeInteger(quantity) || quantity < 1)
    throw new ValidationError("Quantity must be a positive whole number");
  await db.transaction(async (trx) => {
    const cart = await store.getOrCreateCart(userId, sessionId, trx);
    await trx("carts").where({ id: cart.id }).forUpdate().first();
    const product = await trx("products")
      .where({ id: productId, is_active: true })
      .forUpdate()
      .first();
    if (!product) throw new NotFoundError("Product not found");
    const existing = await trx("cart_items")
      .where({ cart_id: cart.id, product_id: productId })
      .first();
    if (!add && !existing) throw new NotFoundError("Cart item not found");
    const next = quantity + (add ? (existing?.quantity ?? 0) : 0);
    if (next > product.stock_quantity)
      throw new ValidationError("Not enough stock");
    await trx("cart_items")
      .insert({
        cart_id: cart.id,
        product_id: productId,
        quantity: next,
        unit_price: product.price,
      })
      .onConflict(["cart_id", "product_id"])
      .merge({ quantity: next, unit_price: product.price });
  });
}

/** Removes a cart item and returns the fresh cart. */
export async function removeCartItem(
  userId: number | null,
  sessionId: string | null,
  productId: number,
) {
  const cart = await store.getOrCreateCart(userId, sessionId);
  await store.deleteCartItem(cart.id, productId);
  return getCart(userId, sessionId);
}

/** Merges a guest cart into a user cart by keeping the larger quantity. */
export async function mergeCart(userId: number, sessionId: string) {
  await db.transaction(async (trx) => {
    const guest = await store.getOrCreateCart(null, sessionId, trx);
    const user = await store.getOrCreateCart(userId, null, trx);
    const guestItems = await store.getCartItems(guest.id, trx);
    for (const item of guestItems as any[]) {
      const existing = await trx("cart_items")
        .where({ cart_id: user.id, product_id: item.product_id })
        .first();
      if (existing) {
        await trx("cart_items")
          .where({ id: existing.id })
          .update({ quantity: Math.max(existing.quantity, item.quantity) });
      } else {
        await trx("cart_items").insert({
          cart_id: user.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        });
      }
    }
    await trx("cart_items").where({ cart_id: guest.id }).delete();
  });
  return getCart(userId, null);
}

/** Calculates shipping and tax for checkout. */
function totals(subtotal: number, shippingMethod: string) {
  const shipping =
    shippingMethod === "express"
      ? 12.99
      : shippingMethod === "free" || subtotal > 50
        ? 0
        : 5.99;
  const tax = Number((subtotal * 0.0825).toFixed(2));
  return {
    shipping,
    tax,
    total: Number((subtotal + shipping + tax).toFixed(2)),
  };
}

/** Places an order atomically from cart contents. */
export async function checkout(
  userId: number,
  payload: { addressId: number; shippingMethod: string; paymentMethod: string },
) {
  return db.transaction(async (trx) => {
    const address = await trx("addresses")
      .where({ id: payload.addressId, user_id: userId })
      .first();
    if (!address) throw new NotFoundError("Address not found");
    const cart = await store.getOrCreateCart(userId, null, trx);
    await trx("carts").where({ id: cart.id }).forUpdate().first();
    const cartRows = await trx("cart_items").where({ cart_id: cart.id });
    await trx("products")
      .whereIn(
        "id",
        cartRows.map((row) => row.product_id),
      )
      .orderBy("id")
      .forUpdate();
    const items = await store.getCartItems(cart.id, trx);
    if (!items.length) throw new ValidationError("Cart is empty");
    for (const item of items as any[]) {
      if (
        !item.product.is_active ||
        item.product.stock_quantity < item.quantity
      )
        throw new ValidationError(`${item.product.name} is out of stock`);
    }
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + Number(item.unit_price) * item.quantity,
      0,
    );
    const price = totals(subtotal, payload.shippingMethod);
    const [order] = await trx("orders")
      .insert({
        order_number: orderNumber(),
        user_id: userId,
        status: "confirmed",
        subtotal,
        shipping_cost: price.shipping,
        tax_amount: price.tax,
        total: price.total,
        shipping_address: address,
        shipping_method: payload.shippingMethod,
        payment_method: payload.paymentMethod,
        payment_status: "paid",
      })
      .returning("*");
    await trx("order_items").insert(
      (items as any[]).map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: Number(item.unit_price) * item.quantity,
      })),
    );
    for (const item of items as any[]) {
      await trx("products")
        .where({ id: item.product_id })
        .decrement("stock_quantity", item.quantity);
    }
    await trx("cart_items").where({ cart_id: cart.id }).delete();
    return order;
  });
}

/** Adds a review and recalculates product aggregates. */
export async function createReview(
  userId: number,
  productId: number,
  data: Record<string, unknown>,
) {
  const purchased = await db("order_items")
    .join("orders", "orders.id", "order_items.order_id")
    .where({ "orders.user_id": userId, "order_items.product_id": productId })
    .first();
  const [review] = await db("reviews")
    .insert({
      ...data,
      user_id: userId,
      product_id: productId,
      is_verified_purchase: Boolean(purchased),
    })
    .onConflict(["product_id", "user_id"])
    .merge({ ...data, is_verified_purchase: Boolean(purchased) })
    .returning("*");
  const [stats] = await db("reviews")
    .where({ product_id: productId })
    .avg("rating as avg")
    .count("id as count");
  await db("products")
    .where({ id: productId })
    .update({
      avg_rating: Number(stats.avg ?? 0).toFixed(1),
      review_count: Number(stats.count ?? 0),
    });
  return review;
}

/** Computes small admin dashboard metrics. */
export async function adminDashboard() {
  const [revenue] = await db("orders")
    .sum("total as total")
    .count("id as orders");
  const [products] = await db("products")
    .count("id as count")
    .sum("stock_quantity as stock");
  const recent = await db("orders").orderBy("created_at", "desc").limit(5);
  return {
    revenue: Number(revenue.total ?? 0),
    orders: Number(revenue.orders ?? 0),
    products: Number(products.count ?? 0),
    stock: Number(products.stock ?? 0),
    recent,
  };
}
