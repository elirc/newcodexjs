import { Router } from "express";
import * as controller from "../controllers/storeController.js";
import { validateBody } from "../middleware/validate.js";
import { addressSchema, cartItemSchema, checkoutSchema, productSchema, quantitySchema, reviewSchema, statusSchema } from "../validators/storeValidators.js";

export const storeRouter = Router();

storeRouter.get("/products", controller.listProducts);
storeRouter.get("/products/:slug", controller.getProduct);
storeRouter.get("/products/:id/reviews", controller.reviews);
storeRouter.get("/categories", controller.categories);
storeRouter.get("/categories/:slug/products", controller.categoryProducts);
storeRouter.get("/cart", controller.cart);
storeRouter.post("/cart/items", validateBody(cartItemSchema), controller.addItem);
storeRouter.put("/cart/items/:productId", validateBody(quantitySchema), controller.updateItem);
storeRouter.delete("/cart/items/:productId", controller.removeItem);
storeRouter.post("/cart/merge", controller.mergeCart);
storeRouter.get("/addresses", controller.addresses);
storeRouter.post("/addresses", validateBody(addressSchema), controller.createAddress);
storeRouter.put("/addresses/:id", validateBody(addressSchema.partial()), controller.updateAddress);
storeRouter.delete("/addresses/:id", controller.deleteAddress);
storeRouter.post("/checkout", validateBody(checkoutSchema), controller.checkout);
storeRouter.get("/orders", controller.orders);
storeRouter.get("/orders/:id", controller.order);
storeRouter.post("/products/:id/reviews", validateBody(reviewSchema), controller.createReview);
storeRouter.get("/wishlist", controller.wishlist);
storeRouter.post("/wishlist/:productId", controller.addWishlist);
storeRouter.delete("/wishlist/:productId", controller.removeWishlist);
storeRouter.get("/admin/products", controller.adminProducts);
storeRouter.post("/admin/products", validateBody(productSchema), controller.adminCreateProduct);
storeRouter.put("/admin/products/:id", validateBody(productSchema), controller.adminUpdateProduct);
storeRouter.delete("/admin/products/:id", controller.adminDeleteProduct);
storeRouter.get("/admin/orders", controller.adminOrders);
storeRouter.put("/admin/orders/:id/status", validateBody(statusSchema), controller.adminOrderStatus);
storeRouter.get("/admin/dashboard", controller.adminDashboard);

