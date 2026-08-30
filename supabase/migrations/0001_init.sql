-- 0001_init.sql
-- Arranque mínimo del esquema. El SQL sigue siendo la fuente de verdad
-- (ver sección 06 del plan de arquitectura); Drizzle sólo lee de aquí
-- vía `drizzle-kit pull`. El esquema de negocio (28 tablas, RLS,
-- funciones) llega módulo a módulo en las fases B2 en adelante.

create extension if not exists pgcrypto;

-- Tabla de arranque: sólo prueba el pipeline migración -> pull -> verify.
-- No es una tabla de negocio.
create table if not exists app_meta (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz not null default now()
);

comment on table app_meta is 'Metadatos internos del backend. No es dominio de negocio.';

insert into app_meta (key, value)
values ('schema_bootstrap', 'b1')
on conflict (key) do nothing;
