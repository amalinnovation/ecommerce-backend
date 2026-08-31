# Admin CRUD API — diseño

Fecha: 2026-08-30
Estado: aprobado, pendiente de plan de implementación

## Contexto y objetivo

El backend hexagonal (NestJS + Drizzle sobre Supabase) tiene hoy solo lectura
pública en `catalog` (productos, categorías, variantes, búsqueda) y en
`pricing` (precio vigente resuelto contra la vista `variant_price`). No existe
ningún concepto de usuario administrador — `identity` solo modela visitantes
anónimos por cookie (`visitors`).

Se necesita un backend de escritura para un dashboard de administración:
alta/edición/baja de productos, categorías, variantes, y fijar precios. Esto
requiere primero introducir autenticación de administrador, ya que hoy no hay
ninguna ruta protegida en el sistema.

## Alcance

Incluye:
- Módulo `admin`: login de administrador (tabla propia + JWT propio).
- Escritura en `catalog`: categorías, productos, variantes.
- Escritura en `pricing`: fijar precio de una variante (con historial).

Explícitamente fuera de alcance (decisiones tomadas durante el brainstorming):
- Endpoint de registro de administradores (se crean con un script CLI).
- Integración con Supabase Auth para admins (se usa tabla propia + JWT propio).
- Gestión de stock como flujo separado de "editar variante" (el stock es un
  campo más de la variante, sin movimientos/auditoría de inventario).
- Borrado físico de productos (es soft delete vía `status`).

## 1. Módulo `admin` (autenticación)

### Domain (`src/modules/admin/domain`)
- `AdminUser { id, email, passwordHash, createdAt }`.
- `AdminRepositoryPort { findByEmail(email): Promise<AdminUser | null> }`.
- `InvalidCredentialsError extends DomainError` — code `admin.invalid_credentials`, httpStatus 401.

### Application (`src/modules/admin/application`)
- `LoginAdminUseCase.execute(email, password): Promise<{ token: string }>`
  - Busca el admin por email; si no existe o el hash no matchea (bcrypt.compare),
    lanza `InvalidCredentialsError`.
  - Firma un JWT (`@nestjs/jwt`) con payload `{ sub: admin.id, email: admin.email }`,
    `expiresIn: '8h'`, usando `ADMIN_JWT_SECRET`.

### Infrastructure (`src/modules/admin/infrastructure`)
- `DrizzleAdminRepository implements AdminRepositoryPort`.
- `AdminAuthController`:
  - `POST /v1/admin/auth/login` — body `{ email, password }` (DTO con
    `class-validator`), devuelve `{ token }`.
- `AdminAuthGuard implements CanActivate`:
  - Lee `Authorization: Bearer <token>`. Si falta o el JWT no valida, lanza
    `UnauthorizedException` (pasa por el `GlobalExceptionFilter` existente,
    que ya sabe mapear `HttpException` genéricas).
  - Si es válido, cuelga `req.admin = { id, email }` y deja pasar.
- `AdminModule`:
  - `providers`: `LoginAdminUseCase`, `AdminAuthGuard`, binding del port a
    `DrizzleAdminRepository`, `JwtModule.register({ secret: process.env.ADMIN_JWT_SECRET })`.
  - `exports`: `AdminAuthGuard` (vía `index.ts` del módulo — mismo patrón que
    `CatalogPriceQuoterAdapter` se exporta desde `pricing/index.ts`).

### Config
- Nueva env var `ADMIN_JWT_SECRET`, validada con zod (mínimo 32 caracteres,
  mismo criterio que `COOKIE_SECRET` en el schema de validación de entorno
  existente).

### Script de bootstrap
- `scripts/create-admin.ts` (tsx, mismo estilo que `scripts/bootstrap/verify.ts`):
  recibe email/password por argumento o prompt, hashea con bcrypt, inserta en
  `admins` vía el cliente Drizzle. Es la única forma de crear administradores.

### Nuevas dependencias
- `@nestjs/jwt`, `bcrypt`, `@types/bcrypt` (dev).

### Migración `supabase/migrations/0003_admins.sql`
```sql
create table admins (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  created_at    timestamptz not null default now()
);
```
Aplicar con `supabase db push` contra el proyecto `amal-ecommerce-backend`
(ref `vyztsdsuiakmnmabsbke`), luego `npm run db:pull` para resincronizar
`schema.ts`/`relations.ts`.

## 2. Catalog: escritura

Nuevo `AdminCatalogController` en `catalog/infrastructure/http/`, todas las
rutas con `@UseGuards(AdminAuthGuard)` (guard importado desde `../../admin`).

### Categorías
- `POST /v1/admin/categories` — `{ name, slug, parentId?, position? }`.
- `PATCH /v1/admin/categories/:id` — mismos campos, todos opcionales.
- `DELETE /v1/admin/categories/:id` — hard delete. La FK `categories.parent_id`
  (`on delete restrict`) y `products.category_id` (sin `on delete`, por tanto
  restrict por defecto) hacen que Postgres rechace el delete si hay hijos o
  productos. El repo detecta el código `23503` (foreign_key_violation) y
  relanza `CategoryHasDependentsError extends DomainError` (code
  `catalog.category_has_dependents`, httpStatus 409) en vez de dejar
  propagar el error crudo de Postgres.
- Conflicto de `slug` duplicado (unique violation, código `23505`) →
  `SlugConflictError` (code `catalog.slug_conflict`, httpStatus 409).

`CategoryRepositoryPort` se extiende con `create`, `update`, `delete`.

### Productos
- `POST /v1/admin/products` — `{ categoryId, slug, name, description?, status?, isFeatured? }`.
- `PATCH /v1/admin/products/:id` — mismos campos, opcionales.
- `DELETE /v1/admin/products/:id` — **soft delete**: `UPDATE products SET status = 'archived'`.
  No borra la fila (preserva historial de pedidos/carritos que referencian
  sus variantes).

`ProductRepositoryPort` se extiende con `create`, `update`, `archive`.
Slug duplicado → mismo `SlugConflictError`.

### Variantes
- `POST /v1/admin/products/:productId/variants` — `{ sku, attributes?, stock? }`.
- `PATCH /v1/admin/variants/:id` — `{ sku?, attributes?, stock? }`.
- `DELETE /v1/admin/variants/:id` — hard delete. FK `cart_items.variant_id`
  (sin `on delete`, restrict por defecto) puede rechazar el delete si la
  variante está en algún carrito. El repo traduce `23503` a
  `VariantInUseError` (code `catalog.variant_in_use`, httpStatus 409).
  SKU duplicado (`23505`) → `SkuConflictError` (code `catalog.sku_conflict`,
  httpStatus 409).

Nuevo `ProductVariantRepositoryPort` (no existe hoy — las variantes solo se
leen embebidas dentro de `findBySlug`), con `create`, `update`, `delete`,
implementado por `DrizzleProductVariantRepository`.

## 3. Pricing: fijar precio

Nuevo `AdminPricingController` en `pricing/infrastructure/http/`, guardado
igual con `AdminAuthGuard`.

- `PUT /v1/admin/variants/:variantId/price` — `{ amount, offerAmount? }`.

`SetVariantPriceUseCase.execute(variantId, amount, offerAmount?)`:
1. En una transacción Drizzle:
   - `UPDATE prices SET ends_at = now() WHERE variant_id = :variantId AND ends_at IS NULL`
     (cierra el precio abierto actual, si existe).
   - `INSERT INTO prices (variant_id, amount, offer_amount, starts_at) VALUES (:variantId, :amount, :offerAmount, now())`.
2. Esto respeta el índice único `ux_prices_variant_open` (un solo precio
   abierto por variante) y preserva el historial completo sin necesidad de
   un flujo separado de "editar" vs "crear".

Validación de `offerAmount < amount` y `amount >= 0`: se valida en el DTO
(`class-validator`) y además el `check` constraint de la tabla (`prices_check`,
`prices_amount_check`) actúa como defensa final — su violación (`23514`,
check_violation) se traduce a `InvalidPriceError` (code `pricing.invalid_price`,
httpStatus 400) en vez de un 500.

`PriceRepositoryPort` se extiende con `setCurrent(variantId, amount, offerAmount)`.

## 4. Manejo de errores — resumen de nuevos `DomainError`

| Error | code | httpStatus | Disparador |
|---|---|---|---|
| `InvalidCredentialsError` | `admin.invalid_credentials` | 401 | login con email/password incorrectos |
| `CategoryHasDependentsError` | `catalog.category_has_dependents` | 409 | delete de categoría con hijos o productos |
| `SlugConflictError` | `catalog.slug_conflict` | 409 | slug duplicado en categoría o producto |
| `VariantInUseError` | `catalog.variant_in_use` | 409 | delete de variante referenciada en `cart_items` |
| `SkuConflictError` | `catalog.sku_conflict` | 409 | sku duplicado |
| `InvalidPriceError` | `pricing.invalid_price` | 400 | violación de check constraint en `prices` |

Todos siguen el patrón existente (`extends DomainError`, capturado por el
`GlobalExceptionFilter` ya implementado — no requiere cambios en el filtro).

## 5. Testing

- **Unitarios (vitest)**: un test por use-case nuevo, mockeando los ports
  (`AdminRepositoryPort`, `CategoryRepositoryPort`, `ProductRepositoryPort`,
  `ProductVariantRepositoryPort`, `PriceRepositoryPort`). Cubren camino feliz
  y cada `DomainError` que el use-case puede producir.
- **Integración (testcontainers, `test:integration`)**: contra Postgres real,
  para los repos Drizzle nuevos/extendidos — probar que los conflictos FK y
  unique realmente se traducen al `DomainError` esperado (no solo mockeado).
- **E2E (`test:e2e`)**:
  - `AdminAuthGuard`: sin token → 401; token inválido/expirado → 401; token
    válido → pasa.
  - Login: credenciales correctas → 200 + token; incorrectas → 401.
  - Smoke test por endpoint de escritura nuevo (crear categoría → crear
    producto en ella → crear variante → fijar precio → verificar que aparece
    correctamente vía las rutas públicas de lectura ya existentes).

## 6. Orden de implementación sugerido

1. `admin` module completo (migración, entidad, use-case, guard, controller,
   script `create-admin.ts`) — es prerequisito de todo lo demás.
2. Catalog: categorías → productos → variantes (en ese orden, por
   dependencias de FK).
3. Pricing: fijar precio.

Cada paso es testeable end-to-end de forma independiente antes de pasar al
siguiente.
