-- Shopping Mall Schema for MODOO Uniform Shop
-- 쇼핑몰 상품 관리를 위한 데이터베이스 스키마

-- Extensions (if not already enabled)
create extension if not exists pgcrypto;

-- Product Categories
create table if not exists product_categories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Category hierarchy
  parent_id uuid references product_categories(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  sort_order int default 0,
  is_active boolean default true,
  
  -- Images
  image_url text,
  icon_url text
);

-- Products
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Basic info
  name text not null,
  slug text not null unique,
  description text,
  short_description text,
  sku text unique,
  
  -- Category
  category_id uuid references product_categories(id),
  
  -- Pricing
  base_price decimal(10,2) default 0,
  sale_price decimal(10,2),
  cost_price decimal(10,2),
  
  -- Inventory
  manage_stock boolean default true,
  stock_quantity int default 0,
  low_stock_threshold int default 5,
  
  -- Status
  is_active boolean default true,
  is_featured boolean default false,
  
  -- SEO
  meta_title text,
  meta_description text,
  
  -- Attributes
  attributes jsonb default '{}', -- flexible key-value pairs
  
  -- Display order
  sort_order int default 0
);

-- Additional attributes for product detail experience
alter table if exists products
  add column if not exists size_chart_url text; -- public URL for size chart image

-- Product Images
create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  
  product_id uuid references products(id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order int default 0,
  is_primary boolean default false
);

-- Product Options (Size, Color, etc.)
create table if not exists product_options (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  
  product_id uuid references products(id) on delete cascade,
  
  -- Option details
  type text not null, -- 'size', 'color', 'material', etc.
  name text not null, -- 'S', 'M', 'L' or '빨강', '파랑', etc.
  value text not null, -- machine-readable value
  
  -- Pricing modifier
  price_modifier decimal(10,2) default 0,
  
  -- Stock for this specific option
  stock_quantity int default 0,
  sku_suffix text,
  
  -- Display
  sort_order int default 0,
  is_active boolean default true,
  
  -- Visual representation (for colors, patterns)
  image_url text,
  color_hex text -- for color swatches
);

-- Product Option Combinations (for complex products with multiple option types)
create table if not exists product_option_combinations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  
  product_id uuid references products(id) on delete cascade,
  
  -- Combination of options (JSON array of option IDs)
  option_ids uuid[] not null,
  
  -- Pricing for this specific combination
  price decimal(10,2),
  sale_price decimal(10,2),
  
  -- Stock for this combination
  stock_quantity int default 0,
  sku text unique,
  
  -- Status
  is_active boolean default true
);

-- Product Content (for detailed pages)
create table if not exists product_content (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  product_id uuid references products(id) on delete cascade,
  
  -- Content sections
  section_type text not null, -- 'top', 'middle', 'bottom', 'spec', 'care'
  title text,
  content text, -- HTML content
  sort_order int default 0,
  is_active boolean default true
);

-- Shopping Cart (for logged-in users)
create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- User reference (can be null for guest carts)
  user_id uuid references auth.users(id) on delete cascade,
  session_id text, -- for guest users
  
  -- Product details
  product_id uuid references products(id) on delete cascade,
  option_combination_id uuid references product_option_combinations(id),
  selected_options jsonb, -- backup of selected options for flexibility
  
  -- Quantity and pricing snapshot
  quantity int not null default 1,
  unit_price decimal(10,2) not null,
  total_price decimal(10,2) not null
);

-- Indexes for performance
create index if not exists idx_product_categories_parent on product_categories (parent_id);
create index if not exists idx_product_categories_slug on product_categories (slug);
create index if not exists idx_products_category on products (category_id);
create index if not exists idx_products_slug on products (slug);
create index if not exists idx_products_active on products (is_active) where is_active = true;
create index if not exists idx_product_images_product on product_images (product_id, sort_order);
create index if not exists idx_product_options_product on product_options (product_id, type);
create index if not exists idx_product_option_combinations_product on product_option_combinations (product_id);
create index if not exists idx_cart_items_user on cart_items (user_id);
create index if not exists idx_cart_items_session on cart_items (session_id);

-- Orders
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- linkage & identity
  user_id uuid references auth.users(id),
  session_id text,
  shop_order_no text not null unique,

  -- status: 'pending' | 'paid' | 'failed' | 'cancelled'
  status text not null default 'pending',

  -- totals
  subtotal decimal(10,2) not null default 0,
  shipping_fee decimal(10,2) not null default 0,
  total_amount decimal(10,2) not null default 0,

  -- payment method
  payment_method text,

  -- orderer info
  order_name text,
  order_phone text,
  order_email text,

  -- shipping info
  shipping_method text,
  same_as_orderer boolean default true,
  receiver_name text,
  receiver_phone text,
  zip_code text,
  addr1 text,
  addr2 text,

  -- pg payloads
  pg_provider text default 'easypay',
  pg_authorization_id text,
  pg_approval jsonb,
  pg_return_payload jsonb
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  order_id uuid references orders(id) on delete cascade,

  product_id uuid,
  product_name text,
  product_slug text,
  selected_options jsonb,
  unit_price decimal(10,2) not null,
  quantity int not null,
  total_price decimal(10,2) not null
);

create index if not exists idx_orders_shop_order_no on orders (shop_order_no);
create index if not exists idx_orders_status on orders (status);

-- Optional: reasons for cancellation/refund
alter table if exists orders
  add column if not exists cancel_reason text,
  add column if not exists refund_reason text;

-- User Addresses (배송지 주소록)
create table if not exists user_addresses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  user_id uuid references auth.users(id) on delete cascade,

  label text not null, -- 배송지 이름
  orderer_name text,
  orderer_phone text,
  receiver_name text,
  receiver_phone text,
  zip_code text,
  addr1 text,
  addr2 text,
  is_default boolean default false
);

create index if not exists idx_user_addresses_user on user_addresses (user_id);

-- RLS Policies
alter table product_categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_options enable row level security;
alter table product_option_combinations enable row level security;
alter table product_content enable row level security;
alter table cart_items enable row level security;

-- Public read access for products and categories
drop policy if exists public_read_categories on product_categories;
create policy public_read_categories on product_categories 
  for select to anon, authenticated using (is_active = true);

drop policy if exists public_read_products on products;
create policy public_read_products on products 
  for select to anon, authenticated using (is_active = true);

drop policy if exists public_read_product_images on product_images;
create policy public_read_product_images on product_images 
  for select to anon, authenticated using (true);

drop policy if exists public_read_product_options on product_options;
create policy public_read_product_options on product_options 
  for select to anon, authenticated using (is_active = true);

drop policy if exists public_read_product_combinations on product_option_combinations;
create policy public_read_product_combinations on product_option_combinations 
  for select to anon, authenticated using (is_active = true);

drop policy if exists public_read_product_content on product_content;
create policy public_read_product_content on product_content 
  for select to anon, authenticated using (is_active = true);

-- Admin write access
drop policy if exists admin_write_categories on product_categories;
create policy admin_write_categories on product_categories 
  for all to authenticated using (true) with check (true);

drop policy if exists admin_write_products on products;
create policy admin_write_products on products 
  for all to authenticated using (true) with check (true);

drop policy if exists admin_write_product_images on product_images;
create policy admin_write_product_images on product_images 
  for all to authenticated using (true) with check (true);

drop policy if exists admin_write_product_options on product_options;
create policy admin_write_product_options on product_options 
  for all to authenticated using (true) with check (true);

drop policy if exists admin_write_product_combinations on product_option_combinations;
create policy admin_write_product_combinations on product_option_combinations 
  for all to authenticated using (true) with check (true);

drop policy if exists admin_write_product_content on product_content;
create policy admin_write_product_content on product_content 
  for all to authenticated using (true) with check (true);

-- Cart access (users can only access their own cart)
drop policy if exists user_cart_access on cart_items;
create policy user_cart_access on cart_items 
  for all to authenticated 
  using (auth.uid() = user_id) 
  with check (auth.uid() = user_id);

-- Guest cart access (by session)
drop policy if exists guest_cart_access on cart_items;
create policy guest_cart_access on cart_items 
  for all to anon 
  using (session_id is not null) 
  with check (session_id is not null);

-- Storage bucket for product images
do $$ begin
  perform storage.create_bucket('products', public => true);
exception when others then null; end $$;

-- RPC Functions
create or replace function get_product_with_options(product_slug text)
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'product', row_to_json(p),
    'category', row_to_json(c),
    'images', (
      select json_agg(row_to_json(pi) order by pi.sort_order)
      from product_images pi
      where pi.product_id = p.id
    ),
    'options', (
      select json_object_agg(
        po.type,
        json_agg(row_to_json(po) order by po.sort_order)
      )
      from product_options po
      where po.product_id = p.id and po.is_active = true
      group by po.type
    ),
    'content', (
      select json_agg(row_to_json(pc) order by pc.sort_order)
      from product_content pc
      where pc.product_id = p.id and pc.is_active = true
    )
  ) into result
  from products p
  left join product_categories c on c.id = p.category_id
  where p.slug = product_slug and p.is_active = true;
  
  return result;
end;
$$ language plpgsql security definer;

-- Fixed Content (global sections: top, bottom, hero, case)
create table if not exists fixed_content (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  section_type text not null, -- 'top' | 'bottom'
  title text,
  content text not null,
  is_active boolean default true
);

-- Extend fixed_content for ordering where needed (hero/case)
alter table if exists fixed_content
  add column if not exists sort_order int;

-- Portfolio (제작사례 전용 테이블)
create table if not exists portfolio (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  title text not null,
  description text,
  photo text,
  date date,
  image_url text,
  category text,
  sort_order int,
  is_active boolean default true
);

create or replace function get_products_by_category(category_slug text default null, limit_count int default 20, offset_count int default 0)
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'products', json_agg(
      json_build_object(
        'product', row_to_json(p),
        'category', row_to_json(c),
        'primary_image', (
          select pi.url
          from product_images pi
          where pi.product_id = p.id and pi.is_primary = true
          limit 1
        ),
        'price_range', (
          select json_build_object(
            'min', min(coalesce(p.sale_price, p.base_price) + coalesce(po.price_modifier, 0)),
            'max', max(coalesce(p.sale_price, p.base_price) + coalesce(po.price_modifier, 0))
          )
          from product_options po
          where po.product_id = p.id and po.is_active = true
        )
      )
      order by p.sort_order, p.created_at desc
    ),
    'total_count', count(*) over()
  ) into result
  from products p
  left join product_categories c on c.id = p.category_id
  where p.is_active = true
    and (category_slug is null or c.slug = category_slug)
  limit limit_count offset offset_count;
  
  return result;
end;
$$ language plpgsql security definer;