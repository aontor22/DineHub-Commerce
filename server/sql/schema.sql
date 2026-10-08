CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
  password_hash TEXT, google_id TEXT UNIQUE, phone TEXT, role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK(role IN ('CUSTOMER','ADMIN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS categories (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
 image TEXT, position INT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS products (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), category_id UUID NOT NULL REFERENCES categories(id),
 name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, sku TEXT NOT NULL UNIQUE, description TEXT NOT NULL DEFAULT '',
 material TEXT NOT NULL DEFAULT '', brand TEXT NOT NULL DEFAULT 'DineHub', image TEXT NOT NULL DEFAULT '',
 gallery JSONB NOT NULL DEFAULT '[]'::jsonb, tags TEXT[] NOT NULL DEFAULT '{}', base_price INT NOT NULL CHECK(base_price>=0),
 compare_price INT CHECK(compare_price>=0), featured BOOLEAN NOT NULL DEFAULT false,
 active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS variants (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
 name TEXT NOT NULL, sku TEXT NOT NULL UNIQUE, options JSONB NOT NULL DEFAULT '{}'::jsonb,
 price INT NOT NULL CHECK(price>=0), stock INT NOT NULL DEFAULT 0 CHECK(stock>=0), active BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS coupons (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code TEXT NOT NULL UNIQUE, type TEXT NOT NULL CHECK(type IN ('PERCENT','FIXED')),
 value INT NOT NULL CHECK(value>0), min_subtotal INT NOT NULL DEFAULT 0, max_uses INT, used_count INT NOT NULL DEFAULT 0,
 expires_at TIMESTAMPTZ, active BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS orders (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_no TEXT NOT NULL UNIQUE, user_id UUID REFERENCES users(id) ON DELETE SET NULL,
 tracking_token TEXT NOT NULL UNIQUE,
 customer_name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL,
 address TEXT NOT NULL, area TEXT NOT NULL, city TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '',
 utm_source TEXT NOT NULL DEFAULT '', utm_medium TEXT NOT NULL DEFAULT '', utm_campaign TEXT NOT NULL DEFAULT '', utm_content TEXT NOT NULL DEFAULT '',
 subtotal INT NOT NULL, discount INT NOT NULL DEFAULT 0, shipping INT NOT NULL, total INT NOT NULL,
 coupon_id UUID REFERENCES coupons(id), payment_method TEXT NOT NULL CHECK(payment_method IN ('COD','SSL')),
 payment_status TEXT NOT NULL DEFAULT 'UNPAID' CHECK(payment_status IN ('UNPAID','PENDING','PAID','FAILED','REFUNDED')),
 status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','CONFIRMED','PACKING','SHIPPED','DELIVERED','CANCELLED')),
 transaction_id TEXT UNIQUE, gateway_val_id TEXT, gateway_session_id TEXT,
 payment_expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS order_items (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 product_id UUID REFERENCES products(id) ON DELETE SET NULL,
 variant_id UUID REFERENCES variants(id) ON DELETE SET NULL,
 product_name TEXT NOT NULL, variant_name TEXT NOT NULL, sku TEXT NOT NULL, image TEXT NOT NULL,
 unit_price INT NOT NULL, quantity INT NOT NULL CHECK(quantity>0)
);
CREATE TABLE IF NOT EXISTS wishlists (
 user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
 PRIMARY KEY(user_id,product_id)
);
CREATE TABLE IF NOT EXISTS reviews (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
 rating INT NOT NULL CHECK(rating BETWEEN 1 AND 5), comment TEXT NOT NULL DEFAULT '',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(user_id,product_id)
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('simple',name || ' ' || description));
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_variants_product ON variants(product_id);
