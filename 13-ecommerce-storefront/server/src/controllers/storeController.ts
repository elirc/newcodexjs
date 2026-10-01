import type { Request, Response } from "express";
import { db } from "../config/db.js";
import { env } from "../config/env.js";
import * as model from "../models/storeModel.js";
import * as service from "../services/storeService.js";
import { sendSuccess } from "../utils/http.js";

/** Reads the demo user id from headers. */
function userId(req: Request): number {
  return Number(req.header("x-demo-user-id") ?? env.DEMO_USER_ID);
}

/** Reads a guest session id from headers. */
function sessionId(req: Request): string {
  return String(req.header("x-session-id") ?? env.DEMO_SESSION_ID);
}

/** Lists products with filters. */
export async function listProducts(req: Request, res: Response) {
  sendSuccess(res, await model.listProducts(req.query));
}

/** Gets product detail. */
export async function getProduct(req: Request, res: Response) {
  sendSuccess(res, await model.getProductBySlug(String(req.params.slug)));
}

/** Lists product reviews. */
export async function reviews(req: Request, res: Response) {
  sendSuccess(
    res,
    await db("reviews")
      .where({ product_id: Number(String(req.params.id)) })
      .orderBy("created_at", "desc"),
  );
}

/** Lists categories. */
export async function categories(_req: Request, res: Response) {
  sendSuccess(res, await model.listCategories());
}

/** Lists products by category slug. */
export async function categoryProducts(req: Request, res: Response) {
  const category = await db("categories")
    .where({ slug: String(req.params.slug) })
    .first();
  sendSuccess(
    res,
    await model.listProducts({ ...req.query, category_id: category?.id }),
  );
}

/** Gets the current cart. */
export async function cart(req: Request, res: Response) {
  sendSuccess(res, await service.getCart(userId(req), sessionId(req)));
}

/** Adds an item to cart. */
export async function addItem(req: Request, res: Response) {
  sendSuccess(
    res,
    await service.addToCart(
      userId(req),
      sessionId(req),
      req.body.productId,
      req.body.quantity,
    ),
    201,
  );
}

/** Updates cart quantity. */
export async function updateItem(req: Request, res: Response) {
  sendSuccess(
    res,
    await service.updateCartItem(
      userId(req),
      sessionId(req),
      Number(req.params.productId),
      req.body.quantity,
    ),
  );
}

/** Removes a cart item. */
export async function removeItem(req: Request, res: Response) {
  sendSuccess(
    res,
    await service.removeCartItem(
      userId(req),
      sessionId(req),
      Number(req.params.productId),
    ),
  );
}

/** Merges guest cart into user cart. */
export async function mergeCart(req: Request, res: Response) {
  sendSuccess(res, await service.mergeCart(userId(req), sessionId(req)));
}

/** Lists addresses. */
export async function addresses(req: Request, res: Response) {
  sendSuccess(res, await model.listAddresses(userId(req)));
}

/** Creates an address. */
export async function createAddress(req: Request, res: Response) {
  sendSuccess(res, await model.createAddress(userId(req), req.body), 201);
}

/** Updates an address. */
export async function updateAddress(req: Request, res: Response) {
  sendSuccess(
    res,
    await db("addresses")
      .where({ id: Number(String(req.params.id)), user_id: userId(req) })
      .update(req.body)
      .returning("*")
      .then((rows) => rows[0]),
  );
}

/** Deletes an address. */
export async function deleteAddress(req: Request, res: Response) {
  await db("addresses")
    .where({ id: Number(String(req.params.id)), user_id: userId(req) })
    .delete();
  sendSuccess(res, { deleted: true });
}

/** Places an order. */
export async function checkout(req: Request, res: Response) {
  sendSuccess(res, await service.checkout(userId(req), req.body), 201);
}

/** Lists user orders. */
export async function orders(req: Request, res: Response) {
  sendSuccess(res, await model.listOrders(userId(req)));
}

/** Gets one order. */
export async function order(req: Request, res: Response) {
  sendSuccess(
    res,
    await model.getOrder(Number(String(req.params.id)), userId(req)),
  );
}

/** Creates a product review. */
export async function createReview(req: Request, res: Response) {
  sendSuccess(
    res,
    await service.createReview(
      userId(req),
      Number(String(req.params.id)),
      req.body,
    ),
    201,
  );
}

/** Lists wishlist products. */
export async function wishlist(req: Request, res: Response) {
  sendSuccess(res, await model.wishlist.list(userId(req)));
}

/** Adds a wishlist product. */
export async function addWishlist(req: Request, res: Response) {
  await model.wishlist.add(userId(req), Number(req.params.productId));
  sendSuccess(res, { added: true }, 201);
}

/** Removes a wishlist product. */
export async function removeWishlist(req: Request, res: Response) {
  await model.wishlist.remove(userId(req), Number(req.params.productId));
  sendSuccess(res, { removed: true });
}

/** Lists admin products. */
export async function adminProducts(_req: Request, res: Response) {
  sendSuccess(res, await model.adminProducts());
}

/** Creates an admin product. */
export async function adminCreateProduct(req: Request, res: Response) {
  sendSuccess(res, await model.createProduct(req.body), 201);
}

/** Updates an admin product. */
export async function adminUpdateProduct(req: Request, res: Response) {
  sendSuccess(
    res,
    await model.updateProduct(Number(String(req.params.id)), req.body),
  );
}

/** Deactivates an admin product. */
export async function adminDeleteProduct(req: Request, res: Response) {
  sendSuccess(
    res,
    await model.updateProduct(Number(String(req.params.id)), {
      is_active: false,
    }),
  );
}

/** Lists admin orders. */
export async function adminOrders(_req: Request, res: Response) {
  sendSuccess(res, await model.adminOrders());
}

/** Updates order status. */
export async function adminOrderStatus(req: Request, res: Response) {
  sendSuccess(
    res,
    await db("orders")
      .where({ id: Number(String(req.params.id)) })
      .update({ status: req.body.status, updated_at: db.fn.now() })
      .returning("*")
      .then((rows) => rows[0]),
  );
}

/** Gets admin dashboard stats. */
export async function adminDashboard(_req: Request, res: Response) {
  sendSuccess(res, await service.adminDashboard());
}
