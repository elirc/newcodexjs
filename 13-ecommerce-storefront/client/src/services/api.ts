import axios from "axios";
import type { Cart, Category, Order, Product } from "../types/store";

const sessionKey = "storefront_session_id";

/** Gets or creates a stable guest session id in localStorage. */
function getSessionId(): string {
  const existing = localStorage.getItem(sessionKey);
  if (existing) return existing;
  const next = crypto.randomUUID();
  localStorage.setItem(sessionKey, next);
  return next;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4113/api"
});

api.interceptors.request.use((config) => {
  config.headers["x-demo-user-id"] = "2";
  config.headers["x-session-id"] = getSessionId();
  return config;
});

/** Unwraps the standard response envelope. */
function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export const storeApi = {
  /** Lists products with faceted filters. */
  listProducts: async (params: Record<string, unknown>) => unwrap<{ products: Product[]; total: number }>(await api.get("/products", { params })),
  /** Gets one product detail by slug. */
  getProduct: async (slug: string) => unwrap<Product & { reviews: unknown[]; related: Product[] }>(await api.get(`/products/${slug}`)),
  /** Lists category tree. */
  categories: async () => unwrap<Category[]>(await api.get("/categories")),
  /** Loads current cart by user or guest session. */
  cart: async () => unwrap<Cart>(await api.get("/cart")),
  /** Adds an item to cart. */
  addItem: async (productId: number) => unwrap<Cart>(await api.post("/cart/items", { productId, quantity: 1 })),
  /** Updates cart quantity. */
  updateItem: async (productId: number, quantity: number) => unwrap<Cart>(await api.put(`/cart/items/${productId}`, { quantity })),
  /** Removes a cart item. */
  removeItem: async (productId: number) => unwrap<Cart>(await api.delete(`/cart/items/${productId}`)),
  /** Places an order with a mock payment. */
  checkout: async (payload: { addressId: number; shippingMethod: string; paymentMethod: string }) => unwrap<Order>(await api.post("/checkout", payload)),
  /** Lists demo user orders. */
  orders: async () => unwrap<Order[]>(await api.get("/orders")),
  /** Lists demo user addresses. */
  addresses: async () => unwrap(await api.get("/addresses")),
  /** Adds product to wishlist. */
  wishlistAdd: async (productId: number) => unwrap(await api.post(`/wishlist/${productId}`)),
  /** Lists admin products. */
  adminProducts: async () => unwrap<Product[]>(await api.get("/admin/products")),
  /** Updates admin product. */
  adminUpdateProduct: async (id: number, payload: Partial<Product>) => unwrap<Product>(await api.put(`/admin/products/${id}`, payload)),
  /** Lists admin orders. */
  adminOrders: async () => unwrap<Order[]>(await api.get("/admin/orders")),
  /** Updates an order status. */
  adminOrderStatus: async (id: number, status: string) => unwrap<Order>(await api.put(`/admin/orders/${id}/status`, { status })),
  /** Loads admin dashboard stats. */
  adminDashboard: async () => unwrap(await api.get("/admin/dashboard"))
};

