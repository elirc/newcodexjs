import type { RequestHandler } from "express";
import { Router } from "express";
import * as controller from "../controllers/storeController.js";
import { validateBody } from "../middleware/validate.js";
import {
  addressSchema,
  cartItemSchema,
  checkoutSchema,
  productSchema,
  quantitySchema,
  reviewSchema,
  statusSchema,
} from "../validators/storeValidators.js";

export const storeRouter = Router();

storeRouter.get("/products", wrap(controller.listProducts));
storeRouter.get("/products/:slug", wrap(controller.getProduct));
storeRouter.get("/products/:id/reviews", wrap(controller.reviews));
storeRouter.get("/categories", wrap(controller.categories));
storeRouter.get(
  "/categories/:slug/products",
  wrap(controller.categoryProducts),
);
storeRouter.get("/cart", wrap(controller.cart));
storeRouter.post(
  "/cart/items",
  validateBody(cartItemSchema),
  wrap(controller.addItem),
);
storeRouter.put(
  "/cart/items/:productId",
  validateBody(quantitySchema),
  wrap(controller.updateItem),
);
storeRouter.delete("/cart/items/:productId", wrap(controller.removeItem));
storeRouter.post("/cart/merge", wrap(controller.mergeCart));
storeRouter.get("/addresses", wrap(controller.addresses));
storeRouter.post(
  "/addresses",
  validateBody(addressSchema),
  wrap(controller.createAddress),
);
storeRouter.put(
  "/addresses/:id",
  validateBody(addressSchema.partial()),
  wrap(controller.updateAddress),
);
storeRouter.delete("/addresses/:id", wrap(controller.deleteAddress));
storeRouter.post(
  "/checkout",
  validateBody(checkoutSchema),
  wrap(controller.checkout),
);
storeRouter.get("/orders", wrap(controller.orders));
storeRouter.get("/orders/:id", wrap(controller.order));
storeRouter.post(
  "/products/:id/reviews",
  validateBody(reviewSchema),
  wrap(controller.createReview),
);
storeRouter.get("/wishlist", wrap(controller.wishlist));
storeRouter.post("/wishlist/:productId", wrap(controller.addWishlist));
storeRouter.delete("/wishlist/:productId", wrap(controller.removeWishlist));
storeRouter.get("/admin/products", wrap(controller.adminProducts));
storeRouter.post(
  "/admin/products",
  validateBody(productSchema),
  wrap(controller.adminCreateProduct),
);
storeRouter.put(
  "/admin/products/:id",
  validateBody(productSchema),
  wrap(controller.adminUpdateProduct),
);
storeRouter.delete("/admin/products/:id", wrap(controller.adminDeleteProduct));
storeRouter.get("/admin/orders", wrap(controller.adminOrders));
storeRouter.put(
  "/admin/orders/:id/status",
  validateBody(statusSchema),
  wrap(controller.adminOrderStatus),
);
storeRouter.get("/admin/dashboard", wrap(controller.adminDashboard));

function wrap(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
