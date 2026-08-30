-- 0002_catalog_pricing_cart_analytics.sql
-- Fase B3: catalog + pricing + cart + analytics, más la tabla de
-- visitantes anónimos que necesita `cart`. Identidad completa con
-- JWT/OAuth es B2 y no toca este archivo.

-- ============================================================
-- catalog: categorías, productos, variantes
-- ============================================================

create table categories (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references categories(id) on delete restrict,
  name        text not null,
  slug        text not null unique,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_categories_parent_id on categories(parent_id);

comment on table categories is 'Árbol de categorías. Esta fase sólo usa 2 niveles (parent_id null = raíz), por convención de la capa de aplicación, no por constraint.';

create table products (
  id              uuid primary key default gen_random_uuid(),
  category_id     uuid not null references categories(id),
  slug            text not null unique,
  name            text not null,
  description     text,
  status          text not null default 'active' check (status in ('active','draft','archived')),
  is_featured     boolean not null default false,
  search_vector   tsvector generated always as (
                    to_tsvector('spanish', coalesce(name, '') || ' ' || coalesce(description, ''))
                  ) stored,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_products_category_id on products(category_id);
create index idx_products_status_created_at on products(status, created_at desc, id);
create index idx_products_search_vector on products using gin(search_vector);

comment on table products is 'status: active|draft|archived. Sólo active aparece en catálogo público.';

create table product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  sku         text not null unique,
  attributes  jsonb not null default '{}'::jsonb,
  stock       integer not null default 0 check (stock >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_product_variants_product_id on product_variants(product_id);

-- ============================================================
-- pricing: precio vigente con historial
-- ============================================================

create table prices (
  id            uuid primary key default gen_random_uuid(),
  variant_id    uuid not null references product_variants(id) on delete cascade,
  amount        numeric(12,2) not null check (amount >= 0),
  offer_amount  numeric(12,2) check (offer_amount is null or (offer_amount >= 0 and offer_amount < amount)),
  starts_at     timestamptz not null default now(),
  ends_at       timestamptz check (ends_at is null or ends_at > starts_at),
  created_at    timestamptz not null default now()
);

create index idx_prices_variant_id_starts_at on prices(variant_id, starts_at desc);

-- A lo sumo un período de vigencia "abierto" (sin fecha de fin) por
-- variante, para que la resolución del precio vigente sea determinista.
create unique index ux_prices_variant_open on prices(variant_id) where ends_at is null;

comment on table prices is 'Historial de precios por variante. El precio vigente se resuelve por vigencia (starts_at/ends_at); nunca se actualiza una fila existente, se cierra (ends_at) y se inserta una nueva.';

-- ============================================================
-- analytics: product_scores (cálculo trivial, se refina con eventos reales)
-- ============================================================

create table product_scores (
  product_id  uuid primary key references products(id) on delete cascade,
  score       numeric(10,4) not null default 0,
  updated_at  timestamptz not null default now()
);

create index idx_product_scores_score on product_scores(score desc);

comment on table product_scores is 'Puntaje de popularidad para ordenar listados y recomendaciones. En B3 se calcula con una heurística trivial (is_featured + antigüedad) vía trigger; el cálculo real basado en analytics_events llega después.';

create or replace function trg_sync_product_score() returns trigger as $$
begin
  insert into product_scores (product_id, score, updated_at)
  values (
    new.id,
    (case when new.is_featured then 50 else 0 end)
      + greatest(0, 30 - extract(day from now() - new.created_at))::numeric,
    now()
  )
  on conflict (product_id) do update
    set score = excluded.score, updated_at = excluded.updated_at;
  return new;
end;
$$ language plpgsql;

create trigger products_score_sync
after insert or update of is_featured, created_at on products
for each row execute function trg_sync_product_score();

-- ============================================================
-- identity mínima: visitante anónimo
-- ============================================================

create table visitors (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

comment on table visitors is 'Visitante anónimo identificado por cookie firmada (anon_id). La fusión con una cuenta autenticada llega en B2 y no toca esta tabla.';

-- ============================================================
-- cart
-- ============================================================

create table carts (
  id          uuid primary key default gen_random_uuid(),
  visitor_id  uuid not null references visitors(id) on delete cascade,
  status      text not null default 'active' check (status in ('active','abandoned','converted')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Un solo carrito activo por visitante a la vez.
create unique index ux_carts_visitor_active on carts(visitor_id) where status = 'active';

create table cart_items (
  id          uuid primary key default gen_random_uuid(),
  cart_id     uuid not null references carts(id) on delete cascade,
  variant_id  uuid not null references product_variants(id),
  quantity    integer not null check (quantity > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create index idx_cart_items_cart_id on cart_items(cart_id);

comment on table cart_items is 'Nunca guarda precio: se recalcula en cada lectura contra pricing.prices vía PriceQuoterPort. El unique(cart_id, variant_id) permite resolver "agregar línea" como upsert que incrementa cantidad.';

-- ============================================================
-- analytics: ingesta de eventos
-- ============================================================

create table analytics_events (
  id           uuid primary key default gen_random_uuid(),
  visitor_id   uuid references visitors(id) on delete set null,
  event_type   text not null check (event_type ~ '^[a-z0-9_.]+$'),
  payload      jsonb not null default '{}'::jsonb,
  occurred_at  timestamptz not null default now(),
  received_at  timestamptz not null default now()
);

create index idx_analytics_events_visitor_id on analytics_events(visitor_id);
create index idx_analytics_events_event_type on analytics_events(event_type);
create index idx_analytics_events_occurred_at on analytics_events(occurred_at);

-- ============================================================
-- vista: precio + stock vigente por variante
-- ============================================================

create view variant_price as
select
  pv.id           as variant_id,
  pv.product_id   as product_id,
  pv.sku          as sku,
  pv.stock        as available,
  p.amount        as list_amount,
  p.offer_amount  as offer_amount,
  coalesce(p.offer_amount, p.amount) as price,
  p.starts_at     as starts_at,
  p.ends_at       as ends_at
from product_variants pv
join lateral (
  select amount, offer_amount, starts_at, ends_at
  from prices
  where prices.variant_id = pv.id
    and starts_at <= now()
    and (ends_at is null or ends_at > now())
  order by starts_at desc
  limit 1
) p on true;

comment on view variant_price is 'Precio y stock vigentes por variante. Sólo incluye variantes con un período de precio vigente ahora mismo; variantes sin precio quedan fuera del join (por eso el catálogo usa innerJoin contra esta vista).';
