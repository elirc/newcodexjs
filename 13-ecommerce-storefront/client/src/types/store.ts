export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  children?: Category[];
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  short_description?: string | null;
  price: string;
  compare_at_price?: string | null;
  sku: string;
  category_id?: number | null;
  stock_quantity: number;
  is_active: boolean;
  avg_rating: string;
  review_count: number;
  images?: Array<{ id: number; url: string; alt_text?: string | null; is_primary: boolean }>;
}

export interface CartItem {
  product_id: number;
  quantity: number;
  unit_price: string;
  product: Product;
}

export interface Cart {
  id: number;
  items: CartItem[];
  subtotal: number;
}

export interface Order {
  id: number;
  order_number: string;
  status: string;
  subtotal: string;
  shipping_cost: string;
  tax_amount: string;
  total: string;
  created_at: string;
  items?: Array<{ product_name: string; quantity: number; unit_price: string; line_total: string }>;
}

