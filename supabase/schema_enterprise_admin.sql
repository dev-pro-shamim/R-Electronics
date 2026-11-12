-- ============================================================================
-- Rango Electronics Enterprise Admin Database Schema for Supabase (PostgreSQL)
-- Run in Supabase SQL Editor to enable full native relational persistence.
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. ROLES & PERMISSIONS
create table if not exists public.roles (
  id text primary key,
  name text unique not null,
  description text,
  permissions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  role_id text references public.roles(id) on delete set null,
  active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

-- 2. CATEGORIES, SUBCATEGORIES & BRANDS
alter table if exists public.categories
  add column if not exists parent_id text,
  add column if not exists description text,
  add column if not exists image text,
  add column if not exists active boolean not null default true,
  add column if not exists display_order integer default 0,
  add column if not exists seo_title text,
  add column if not exists seo_description text;

create table if not exists public.subcategories (
  id text primary key,
  category_id text not null references public.categories(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  image text,
  icon text,
  display_order integer not null default 1,
  seo_title text,
  seo_description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(category_id, slug)
);

create table if not exists public.brands (
  id text primary key,
  name text not null,
  slug text unique not null,
  country text,
  logo text,
  description text,
  authorized boolean not null default true,
  active boolean not null default true,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now()
);

-- 3. PRODUCTS & INVENTORY
alter table if exists public.products
  add column if not exists sku text,
  add column if not exists stock integer default 15,
  add column if not exists purchase_price numeric(12,2) default 0,
  add column if not exists status text default 'published',
  add column if not exists featured boolean default false,
  add column if not exists hot_deal boolean default false,
  add column if not exists best_seller boolean default false,
  add column if not exists tags jsonb default '[]'::jsonb,
  add column if not exists related_product_ids jsonb default '[]'::jsonb,
  add column if not exists seo_title text,
  add column if not exists seo_description text;

create table if not exists public.stock_movements (
  id text primary key,
  product_id text not null,
  product_title text not null,
  sku text,
  movement_type text not null check (movement_type in ('stock_in','stock_out','adjustment','order_deduction','order_restore')),
  quantity integer not null,
  previous_stock integer not null,
  new_stock integer not null,
  reference_id text,
  reason text,
  actor text,
  created_at timestamptz not null default now()
);

-- 4. CUSTOMERS, ORDERS, PAYMENTS, INVOICES, COURIERS
create table if not exists public.customers (
  id text primary key,
  full_name text not null,
  phone text not null,
  email text,
  city text,
  address text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

alter table if exists public.orders
  add column if not exists payment_status text default 'Pending Verification',
  add column if not exists courier text,
  add column if not exists tracking_no text,
  add column if not exists delivery_charge numeric(12,2) default 0,
  add column if not exists admin_note text,
  add column if not exists source_channel text default 'website';

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text references public.orders(id) on delete cascade,
  product_id text,
  title text not null,
  unit_price numeric(12,2) not null,
  quantity integer not null,
  subtotal numeric(12,2) not null
);

create table if not exists public.payments (
  id text primary key,
  order_id text not null,
  customer_name text,
  phone text,
  method text not null,
  amount numeric(12,2) not null,
  status text not null check (status in ('Paid','Unpaid','Partial Payment','Pending Verification','Failed','Refunded')),
  transaction_id text,
  sender_number text,
  gateway_reference text,
  verified_by text,
  verified_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id text primary key,
  invoice_number text unique not null,
  order_id text,
  invoice_type text not null check (invoice_type in ('auto','manual')),
  source_channel text default 'Website',
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  customer_address text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null,
  discount numeric(12,2) not null default 0,
  vat_percent numeric(5,2) not null default 0,
  vat_amount numeric(12,2) not null default 0,
  delivery_charge numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  payment_method text not null,
  payment_status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.couriers (
  id text primary key,
  name text not null,
  provider_type text not null,
  enabled boolean not null default false,
  sandbox_mode boolean not null default true,
  base_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.courier_bookings (
  id text primary key,
  order_id text not null,
  courier_id text not null,
  courier_name text not null,
  consignment_id text,
  tracking_id text,
  delivery_status text not null default 'Booked',
  delivery_charge numeric(12,2) not null default 0,
  recipient_name text,
  recipient_phone text,
  recipient_address text,
  booked_at timestamptz not null default now()
);

-- 5. ACCOUNTS & DOUBLE-ENTRY FINANCIAL LEDGER
create table if not exists public.accounts (
  id text primary key,
  name text not null,
  account_type text not null check (account_type in ('Cash','Bank','bKash','Nagad','Other')),
  account_number text,
  opening_balance numeric(14,2) not null default 0,
  current_balance numeric(14,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.financial_transactions (
  id text primary key,
  tx_date date not null default current_date,
  tx_type text not null check (tx_type in ('debit','credit')),
  entry_kind text not null check (entry_kind in ('income','expense','transfer','adjustment','refund')),
  account_id text not null references public.accounts(id),
  category text not null,
  amount numeric(14,2) not null check (amount >= 0),
  reference_no text,
  order_id text,
  counterparty text,
  description text,
  attachment_url text,
  pair_tx_id text,
  actor text,
  created_at timestamptz not null default now()
);

create index if not exists idx_fin_tx_date on public.financial_transactions(tx_date desc);
create index if not exists idx_fin_tx_order on public.financial_transactions(order_id);

-- 6. MARKETING, COUPONS, PIXEL, GTM, POPUPS, BANNERS
create table if not exists public.coupons (
  id text primary key,
  code text unique not null,
  name text not null,
  discount_type text not null check (discount_type in ('percent','fixed')),
  value numeric(12,2) not null,
  min_order numeric(12,2) not null default 0,
  max_discount numeric(12,2),
  start_date date,
  expiry_date date,
  usage_limit integer,
  per_customer_limit integer,
  usage_count integer not null default 0,
  applicable_categories jsonb not null default '[]'::jsonb,
  applicable_products jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.banners (
  id text primary key,
  placement text not null,
  title text not null,
  subtitle text,
  image text not null,
  link text,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.popups (
  id text primary key,
  title text not null,
  description text,
  desktop_image text,
  mobile_image text,
  button_text text,
  button_link text,
  start_date date,
  end_date date,
  display_position text not null default 'center',
  target_pages text not null default 'homepage',
  selected_paths jsonb not null default '[]'::jsonb,
  visitor_rule text not null default 'first_visit',
  frequency text not null default 'once_per_session',
  delay_seconds integer not null default 2,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tracking_settings (
  id text primary key default 'default',
  meta_pixel_id text,
  meta_pixel_enabled boolean not null default false,
  meta_capi_enabled boolean not null default false,
  meta_test_event_code text,
  meta_events jsonb not null default '["PageView","ViewContent","Search","AddToCart","InitiateCheckout","AddPaymentInfo","Purchase","CompleteRegistration"]'::jsonb,
  gtm_container_id text,
  gtm_enabled boolean not null default false,
  ga4_measurement_id text,
  consent_required boolean not null default false,
  updated_at timestamptz not null default now()
);

-- 7. SUPPORT: CHATBOT, CONTACT QUERIES, REVIEWS, Q&A, CMS, EMI, SETTINGS, AUDIT
create table if not exists public.chat_conversations (
  id text primary key,
  customer_name text,
  customer_phone text,
  customer_email text,
  question text not null,
  messages jsonb not null default '[]'::jsonb,
  status text not null default 'open',
  assigned_to text,
  created_at timestamptz not null default now()
);

create table if not exists public.chatbot_faqs (
  id text primary key,
  keywords text not null,
  question text not null,
  answer text not null,
  product_link text,
  active boolean not null default true
);

create table if not exists public.contact_inquiries (
  id text primary key,
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  status text not null default 'Pending',
  assigned_agent text,
  admin_notes text,
  replies jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.cms_pages (
  slug text primary key,
  title text not null,
  content text not null,
  seo_title text,
  meta_description text,
  published boolean not null default true,
  last_updated text,
  updated_at timestamptz not null default now()
);

create table if not exists public.emi_plans (
  id text primary key,
  bank_name text not null,
  short_name text not null,
  tenures jsonb not null,
  processing_fee_percent numeric(5,2) not null default 0,
  interest_rate numeric(5,2) not null default 0,
  zero_emi_eligible boolean not null default true,
  min_order_amount numeric(12,2) not null default 5000,
  applicable_categories jsonb not null default '[]'::jsonb,
  enabled boolean not null default true
);

create table if not exists public.global_settings (
  id text primary key default 'default',
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id text primary key,
  actor text not null,
  actor_role text,
  section text not null,
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

-- Enable RLS across all tables (server uses authenticated service/admin role)
alter table public.roles enable row level security;
alter table public.admin_users enable row level security;
alter table public.brands enable row level security;
alter table public.stock_movements enable row level security;
alter table public.payments enable row level security;
alter table public.invoices enable row level security;
alter table public.couriers enable row level security;
alter table public.courier_bookings enable row level security;
alter table public.accounts enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.coupons enable row level security;
alter table public.banners enable row level security;
alter table public.popups enable row level security;
alter table public.tracking_settings enable row level security;
alter table public.chat_conversations enable row level security;
alter table public.chatbot_faqs enable row level security;
alter table public.contact_inquiries enable row level security;
alter table public.cms_pages enable row level security;
alter table public.emi_plans enable row level security;
alter table public.global_settings enable row level security;
alter table public.audit_logs enable row level security;

-- Public read policies for storefront-safe tables only
do $$ begin
  if not exists (select 1 from pg_policies where tablename='banners' and policyname='Public read active banners') then
    create policy "Public read active banners" on public.banners for select using (active = true);
  end if;
  if not exists (select 1 from pg_policies where tablename='cms_pages' and policyname='Public read published cms pages') then
    create policy "Public read published cms pages" on public.cms_pages for select using (published = true);
  end if;
  if not exists (select 1 from pg_policies where tablename='popups' and policyname='Public read active popups') then
    create policy "Public read active popups" on public.popups for select using (active = true);
  end if;
-- 8. MODERATION, CUSTOMER AUTH PROFILES, EMAIL LOGS & EXTENDED POPUPS
alter table if exists public.popups
  add column if not exists mobile_image text,
  add column if not exists display_location text default 'homepage';

create table if not exists public.product_reviews (
  id text primary key,
  product_id text not null,
  product_slug text,
  product_title text not null,
  customer_name text not null,
  customer_email text,
  customer_location text default 'Bangladesh',
  rating integer not null check (rating between 1 and 5),
  title text,
  comment text not null,
  images jsonb not null default '[]'::jsonb,
  status text not null default 'Pending' check (status in ('Pending','Approved','Rejected')),
  admin_reply text,
  is_test_data boolean not null default false,
  verified_purchase boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.product_questions (
  id text primary key,
  product_id text not null,
  product_slug text,
  product_title text not null,
  customer_name text not null,
  customer_email text,
  question text not null,
  answer text,
  answered_by text,
  status text not null default 'Pending' check (status in ('Pending','Answered','Hidden')),
  created_at timestamptz not null default now(),
  answered_at timestamptz
);

create table if not exists public.customer_profiles (
  id text primary key,
  auth_uid uuid,
  name text not null,
  email text not null,
  phone text,
  provider text not null default 'email',
  email_verified boolean not null default false,
  addresses jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists public.email_notification_logs (
  id text primary key,
  event_key text not null,
  event_type text not null,
  recipient text not null,
  audience text not null check (audience in ('admin','customer')),
  subject text not null,
  status text not null check (status in ('sent','failed','skipped')),
  attempts integer not null default 1,
  provider text not null,
  error text,
  created_at timestamptz not null default now()
);

-- Enable RLS across new tables
alter table public.subcategories enable row level security;
alter table public.product_reviews enable row level security;
alter table public.product_questions enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.email_notification_logs enable row level security;

-- Public read policies for approved reviews, answered Q&A & active brands/subcategories
do $$ begin
  if not exists (select 1 from pg_policies where tablename='brands' and policyname='Public read active brands') then
    create policy "Public read active brands" on public.brands for select using (active = true);
  end if;
  if not exists (select 1 from pg_policies where tablename='subcategories' and policyname='Public read active subcategories') then
    create policy "Public read active subcategories" on public.subcategories for select using (active = true);
  end if;
  if not exists (select 1 from pg_policies where tablename='product_reviews' and policyname='Public read approved reviews') then
    create policy "Public read approved reviews" on public.product_reviews for select using (status = 'Approved' and is_test_data = false);
  end if;
end $$;
