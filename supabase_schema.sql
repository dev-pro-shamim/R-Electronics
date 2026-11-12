-- ====================================================================
-- RANGO ELECTRONICS DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT,
    banner TEXT,
    subcategories JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    brand TEXT NOT NULL,
    model TEXT,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    discount NUMERIC DEFAULT 0,
    in_stock BOOLEAN DEFAULT TRUE,
    thumbnail TEXT NOT NULL,
    images JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    specifications JSONB DEFAULT '[]'::jsonb,
    warranty TEXT,
    emi_available BOOLEAN DEFAULT TRUE,
    rating NUMERIC DEFAULT 5.0,
    reviews_count NUMERIC DEFAULT 11,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    subtotal NUMERIC NOT NULL,
    shipping NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    payment_method TEXT NOT NULL,
    bkash_phone TEXT,
    bkash_trx_id TEXT,
    nagad_phone TEXT,
    nagad_trx_id TEXT,
    status TEXT DEFAULT 'Processing' NOT NULL,
    items JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_slug TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_location TEXT,
    rating NUMERIC NOT NULL,
    comment TEXT NOT NULL,
    verified_buyer BOOLEAN DEFAULT TRUE,
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Grant Public Access Policies (Allow Website to Read and Submit Orders)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read access to categories and products
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);

-- Allow public insert to categories and products (for initial sync)
CREATE POLICY "Public Insert/Update Categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Insert/Update Products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- Allow public insert & read to orders
CREATE POLICY "Public Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Orders" ON public.orders FOR SELECT USING (true);

-- Allow public read & insert to reviews
CREATE POLICY "Public Read Reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Public Insert Reviews" ON public.reviews FOR INSERT WITH CHECK (true);
