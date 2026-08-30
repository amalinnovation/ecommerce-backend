-- verify.sql
-- Arnés de pruebas SQL. Corre contra un Postgres efímero (local o CI) y
-- debe salir en verde antes de mergear. Cada módulo (B2+) añade sus
-- propias pruebas de invariantes aquí mismo, sin rehacer el arnés.
--
-- Convención: cada prueba hace un `select` que debe devolver TRUE, y usa
-- `assert_true` para fallar el script completo (código de salida != 0)
-- si alguna no lo cumple.

\set ON_ERROR_STOP on

do $$
begin
  if not exists (select 1 from information_schema.tables where table_name = 'app_meta') then
    raise exception 'verify.sql: falta la tabla app_meta — ¿corrió la migración 0001_init.sql?';
  end if;
end $$;

do $$
begin
  if not exists (select 1 from app_meta where key = 'schema_bootstrap' and value = 'b1') then
    raise exception 'verify.sql: app_meta.schema_bootstrap no tiene el valor esperado';
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'app_meta' and column_name = 'updated_at' and is_nullable = 'YES'
  ) then
    raise exception 'verify.sql: app_meta.updated_at debería ser NOT NULL';
  end if;
end $$;

-- ---- B3: catalog + pricing + cart + analytics ----

do $$
begin
  if (
    select count(*) from information_schema.tables
    where table_name in ('categories','products','product_variants','prices',
                          'product_scores','visitors','carts','cart_items','analytics_events')
  ) < 9 then
    raise exception 'verify.sql: faltan tablas de la migración 0002';
  end if;
end $$;

do $$
begin
  if not exists (select 1 from information_schema.views where table_name = 'variant_price') then
    raise exception 'verify.sql: falta la vista variant_price';
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_indexes where indexname = 'idx_products_search_vector') then
    raise exception 'verify.sql: falta el índice GIN de búsqueda de texto completo en products';
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_indexes where indexname = 'ux_prices_variant_open') then
    raise exception 'verify.sql: falta el índice único que garantiza un solo período de precio abierto por variante';
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_indexes where indexname = 'ux_carts_visitor_active') then
    raise exception 'verify.sql: falta el índice único que garantiza un solo carrito activo por visitante';
  end if;
end $$;

-- Prueba de comportamiento: el trigger de product_scores realmente escribe.
do $$
declare
  v_category_id uuid;
  v_product_id uuid;
  v_score numeric;
begin
  insert into categories (name, slug) values ('Verify Category', 'verify-category')
  on conflict (slug) do update set name = excluded.name
  returning id into v_category_id;

  insert into products (category_id, slug, name, is_featured)
  values (v_category_id, 'verify-product', 'Verify Product', true)
  on conflict (slug) do update set is_featured = excluded.is_featured, created_at = now()
  returning id into v_product_id;

  select score into v_score from product_scores where product_id = v_product_id;

  if v_score is null or v_score < 50 then
    raise exception 'verify.sql: el trigger products_score_sync no calculó el score esperado para un producto featured';
  end if;
end $$;

\echo 'verify.sql: todas las pruebas pasaron'
