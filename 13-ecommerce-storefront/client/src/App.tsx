import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import styles from "./App.module.css";
import { storeApi } from "./services/api";
import type { Cart, Product } from "./types/store";

/** Coordinates catalog, cart, checkout, orders, wishlist, and admin views. */
export default function App() {
  const [view, setView] = useState<"shop" | "cart" | "orders" | "admin">(
    "shop",
  );
  return (
    <main className={styles.shell}>
      <nav className={styles.nav}>
        <strong>Commerce Classroom</strong>
        {(["shop", "cart", "orders", "admin"] as const).map((item) => (
          <button
            className={view === item ? styles.active : ""}
            key={item}
            onClick={() => setView(item)}
          >
            {item}
          </button>
        ))}
      </nav>
      {view === "shop" && <ShopView />}
      {view === "cart" && <CartView />}
      {view === "orders" && <OrdersView />}
      {view === "admin" && <AdminView />}
    </main>
  );
}

/** Renders product filters, grid, and add-to-cart actions. */
function ShopView() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Record<string, unknown>>({
    sort: "newest",
  });
  const products = useQuery({
    queryKey: ["products", filters],
    queryFn: () => storeApi.listProducts(filters),
  });
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: storeApi.categories,
  });
  const addItem = useMutation({
    mutationFn: storeApi.addItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });
  const wishlist = useMutation({ mutationFn: storeApi.wishlistAdd });

  /** Updates one filter key while preserving the rest. */
  function updateFilter(key: string, value: unknown) {
    setFilters((current) => ({ ...current, [key]: value || undefined }));
  }

  return (
    <section className={styles.page}>
      <aside className={styles.filters}>
        <h2>Filters</h2>
        <select
          onChange={(event) => updateFilter("category_id", event.target.value)}
        >
          <option value="">All categories</option>
          {categories.data?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Min price"
          type="number"
          onChange={(event) => updateFilter("min_price", event.target.value)}
        />
        <input
          placeholder="Max price"
          type="number"
          onChange={(event) => updateFilter("max_price", event.target.value)}
        />
        <select
          onChange={(event) => updateFilter("min_rating", event.target.value)}
        >
          <option value="">Any rating</option>
          <option value="4">4 stars and up</option>
          <option value="3">3 stars and up</option>
        </select>
        <label>
          <input
            type="checkbox"
            onChange={(event) =>
              updateFilter("in_stock", event.target.checked ? "true" : "")
            }
          />{" "}
          In stock only
        </label>
        <select onChange={(event) => updateFilter("sort", event.target.value)}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price low to high</option>
          <option value="price_desc">Price high to low</option>
          <option value="rating">Top rated</option>
        </select>
      </aside>
      <section className={styles.products}>
        {products.data?.products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAdd={() => addItem.mutate(product.id)}
            onWishlist={() => wishlist.mutate(product.id)}
          />
        ))}
      </section>
    </section>
  );
}

interface ProductCardProps {
  product: Product;
  onAdd: () => void;
  onWishlist: () => void;
}

/** Displays a catalog product card with rating, stock, and actions. */
function ProductCard({ product, onAdd, onWishlist }: ProductCardProps) {
  const image =
    product.images?.find((item) => item.is_primary) ?? product.images?.[0];
  return (
    <article className={styles.card}>
      <img
        src={image?.url ?? "https://placehold.co/600x400"}
        alt={image?.alt_text ?? product.name}
      />
      <h3>{product.name}</h3>
      <p>{product.short_description}</p>
      <strong>{formatPrice(product.price)}</strong>
      <span>
        {Number(product.avg_rating).toFixed(1)} stars - {product.review_count}{" "}
        reviews
      </span>
      <small>
        {product.stock_quantity > 0
          ? `${product.stock_quantity} in stock`
          : "Out of stock"}
      </small>
      <div className={styles.actions}>
        <button onClick={onAdd} disabled={product.stock_quantity === 0}>
          Add to cart
        </button>
        <button className={styles.secondary} onClick={onWishlist}>
          Wishlist
        </button>
      </div>
    </article>
  );
}

/** Renders cart contents and checkout button. */
function CartView() {
  const queryClient = useQueryClient();
  const cart = useQuery({ queryKey: ["cart"], queryFn: storeApi.cart });
  const addresses = useQuery({
    queryKey: ["addresses"],
    queryFn: storeApi.addresses,
  });
  const updateItem = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      storeApi.updateItem(id, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });
  const removeItem = useMutation({
    mutationFn: storeApi.removeItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });
  const checkout = useMutation({
    mutationFn: storeApi.checkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
  const firstAddress = (
    addresses.data as Array<{ id: number }> | undefined
  )?.[0];

  return (
    <section className={styles.single}>
      <h1>Cart</h1>
      {(cart.data as Cart | undefined)?.items.map((item) => (
        <article className={styles.lineItem} key={item.product_id}>
          <span>{item.product.name}</span>
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(event) =>
              updateItem.mutate({
                id: item.product_id,
                quantity: Number(event.target.value),
              })
            }
          />
          <strong>
            {formatPrice(Number(item.unit_price) * item.quantity)}
          </strong>
          <button
            className={styles.secondary}
            onClick={() => removeItem.mutate(item.product_id)}
          >
            Remove
          </button>
        </article>
      ))}
      <h2>Subtotal {formatPrice(cart.data?.subtotal ?? 0)}</h2>
      <button
        disabled={!firstAddress || !cart.data?.items.length}
        onClick={() =>
          firstAddress &&
          checkout.mutate({
            addressId: firstAddress.id,
            shippingMethod: "standard",
            paymentMethod: "mock_card",
          })
        }
      >
        Place mock order
      </button>
      {checkout.isSuccess && <p>Order {checkout.data.order_number} placed.</p>}
    </section>
  );
}

/** Displays order history for the demo customer. */
function OrdersView() {
  const orders = useQuery({ queryKey: ["orders"], queryFn: storeApi.orders });
  return (
    <section className={styles.single}>
      <h1>Orders</h1>
      {orders.data?.map((order) => (
        <article className={styles.panel} key={order.id}>
          <strong>{order.order_number}</strong>
          <span>{order.status}</span>
          <span>{formatPrice(order.total)}</span>
        </article>
      ))}
    </section>
  );
}

/** Provides a compact admin panel for product and order operations. */
function AdminView() {
  const queryClient = useQueryClient();
  const dashboard = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: storeApi.adminDashboard,
  });
  const products = useQuery({
    queryKey: ["admin-products"],
    queryFn: storeApi.adminProducts,
  });
  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: storeApi.adminOrders,
  });
  const updateProduct = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Product> }) =>
      storeApi.adminUpdateProduct(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      storeApi.adminOrderStatus(id, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  return (
    <section className={styles.admin}>
      <h1>Admin</h1>
      <div className={styles.stats}>{JSON.stringify(dashboard.data)}</div>
      <div className={styles.panel}>
        <h2>Products</h2>
        {products.data?.slice(0, 12).map((product) => (
          <div className={styles.lineItem} key={product.id}>
            <input
              value={product.name}
              onChange={(event) =>
                updateProduct.mutate({
                  id: product.id,
                  payload: { name: event.target.value },
                })
              }
            />
            <input
              type="number"
              value={product.stock_quantity}
              onChange={(event) =>
                updateProduct.mutate({
                  id: product.id,
                  payload: { stock_quantity: Number(event.target.value) },
                })
              }
            />
          </div>
        ))}
      </div>
      <div className={styles.panel}>
        <h2>Orders</h2>
        {orders.data?.map((order) => (
          <div className={styles.lineItem} key={order.id}>
            <span>{order.order_number}</span>
            <select
              value={order.status}
              onChange={(event) =>
                updateStatus.mutate({
                  id: order.id,
                  status: event.target.value,
                })
              }
            >
              {[
                "pending",
                "confirmed",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
              ].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Formats a number-like value as USD. */
function formatPrice(value: string | number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
}
