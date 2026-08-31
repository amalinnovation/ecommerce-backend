# Módulo `users` (admin + cliente) y roadmap de cuentas — diseño

Fecha: 2026-08-31
Estado: aprobado para la Fase 1 (módulo `users`), fases siguientes a spec/plan aparte
Supersede: la sección "1. Módulo `admin`" de
[2026-08-30-admin-crud-api-design.md](../docs/superpowers/specs/2026-08-30-admin-crud-api-design.md) —
el resto de ese documento (escritura de catalog/pricing, `DomainError`s
nuevos) sigue vigente, solo cambia qué guard usan.

## Contexto

El backend no tiene ningún concepto de usuario autenticado — `identity` solo
modela visitantes anónimos por cookie. Se necesita:

1. Un dashboard de administración (altas/edición/baja de catálogo y precios,
   ya diseñado en el spec anterior) — requiere un admin autenticado.
2. Cuentas de cliente para la tienda (carrito persistente, favoritos,
   tarjetas guardadas, historial de búsqueda, recomendaciones personalizadas).

Decisiones tomadas durante el brainstorming de esta sesión:

- **No hay multi-tenancy.** Se evaluó agregar un concepto de `company` del
  que colgaran productos/categorías/usuarios (un mismo backend sirviendo a
  varias empresas con catálogos aislados), pero se descartó: este backend es
  **reproducible por empresa** (cada empresa despliega su propia instancia),
  no un backend compartido multi-tenant. No se agrega `company_id` a ninguna
  tabla.
- **Un solo módulo `users`**, no `users` + `auth` separados, y no fusionado
  con `identity` (visitantes anónimos siguen siendo un concepto aparte — ver
  razonamiento en la sección "Por qué no se fusiona con `identity`" más
  abajo).
- **Rol como columna**, no tablas separadas `admins`/`customers`: una sola
  tabla `users` con `role text check in ('admin','customer')`, mismo patrón
  que ya usa `products.status`.
- **Redis es trabajo futuro** (Fase 4), no bloquea la Fase 1.

## Por qué no se fusiona con `identity`

Un `Visitor` (anónimo, creado en silencio por middleware en cada request) y
un `User` (registro explícito, con credenciales, rol, larga duración) tienen
ciclos de vida y mecanismos de verificación distintos — un middleware global
vs. un guard explícito en rutas puntuales. Fusionarlos no reduce
complejidad, la reubica, y `identity` ya tiene dependientes reales
(`cart.module.ts` usa `GetOrCreateVisitorUseCase`; `carts.visitor_id` y
`analytics_events.visitor_id` cuelgan de `visitors`). El único punto de
contacto real — qué pasa con el carrito anónimo cuando el visitante se
loguea — se resuelve con una relación entre ambos (ver Fase 3), no
fusionando los módulos.

## Roadmap (fases)

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Módulo `users`: entidad, registro de cliente, login (admin+cliente), JWT, guards de rol | **Este spec — a implementar ahora** |
| 2 | Proteger endpoints de escritura de `catalog`/`pricing` (del spec anterior) con `@Roles('admin')` | Spec ya escrito, pendiente de plan |
| 3 | Cuenta de cliente: favoritos, tarjetas guardadas (tokenizadas), historial de búsqueda, vincular carrito de visitante al loguearse, recomendaciones personalizadas por historial de vistas | Solo roadmap, sin spec todavía |
| 4 | Redis: sesiones revocables/refresh tokens, cache de catálogo | Solo roadmap, sin spec todavía |

Cada fase siguiente se brainstormea y especifica por separado cuando
llegue su turno — evita sobre-diseñar hoy features que todavía pueden
cambiar.

---

## Fase 1 — Módulo `users` (alcance de este documento)

### Domain (`src/modules/users/domain`)
- `User { id, email, passwordHash, role: 'admin' | 'customer', createdAt }`.
- `UserRepositoryPort { findByEmail(email), findById(id), create(data) }`.
- Errores (`extends DomainError`):
  - `InvalidCredentialsError` — `users.invalid_credentials`, 401.
  - `EmailAlreadyRegisteredError` — `users.email_already_registered`, 409.

### Application (`src/modules/users/application`)
- `RegisterCustomerUseCase.execute(email, password)`:
  - Verifica que el email no exista (si existe → `EmailAlreadyRegisteredError`).
  - Hashea con bcrypt, crea el `User` con `role` **fijo en `'customer'`**
    (el caso de uso no acepta rol como parámetro — ni por error se puede
    autoregistrar un admin).
- `LoginUserUseCase.execute(email, password): Promise<{ token: string }>`:
  - Busca por email; si no existe o el hash no matchea → `InvalidCredentialsError`.
  - Firma un JWT con `{ sub: user.id, email, role }`. Sirve para admin y
    cliente por igual — el rol viaja en el claim y cada ruta decide qué
    rol exige.
  - **Duración larga (30 días)** para no forzar reautenticación seguido
    ("sesión que no cierra"). Sin revocación server-side en esta fase — ver
    limitación abajo.

### Infrastructure (`src/modules/users/infrastructure`)
- `DrizzleUserRepository implements UserRepositoryPort`.
- `UsersController`:
  - `POST /v1/auth/register` — público, `{ email, password }` → crea cliente,
    devuelve `{ token }` (login automático post-registro).
  - `POST /v1/auth/login` — público, `{ email, password }` → `{ token }`.
- `JwtAuthGuard implements CanActivate` — valida `Authorization: Bearer`,
  cuelga `req.user = { id, email, role }`. `UnauthorizedException` si falta
  o es inválido.
- `@Roles(...roles: Role[])` decorator + `RolesGuard implements CanActivate`
  — lee los roles requeridos vía `Reflector`, compara con `req.user.role`
  (debe correr **después** de `JwtAuthGuard` en la cadena de guards).
- `UsersModule`:
  - `providers`: `RegisterCustomerUseCase`, `LoginUserUseCase`,
    `JwtAuthGuard`, `RolesGuard`, binding del port a `DrizzleUserRepository`,
    `JwtModule.register({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: '30d' } })`.
  - `exports` (vía `index.ts`, no `infrastructure/` directo): `JwtAuthGuard`,
    `RolesGuard`, `Roles` decorator, `CurrentUser` decorator.

### Config
- Nueva env var `JWT_SECRET` (reemplaza el `ADMIN_JWT_SECRET` que había
  quedado propuesto en el spec anterior — ya no es solo-admin), validada en
  `env.schema.ts` con `z.string().min(32)`, mismo criterio que
  `COOKIE_SECRET`.

### Creación de admins
- Sin endpoint de registro de admin. `scripts/create-admin.ts` (tsx, mismo
  estilo que `scripts/bootstrap/verify.ts`) inserta directo en `users` con
  `role: 'admin'`.

### Migración `supabase/migrations/0003_users.sql`
```sql
create table users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  role          text not null check (role in ('admin','customer')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_users_role on users(role);
```

### Nuevas dependencias
`@nestjs/jwt`, `bcrypt`, `@types/bcrypt` (dev).

### Limitación conocida (aceptada para esta fase)
El JWT de 30 días no se puede revocar antes de expirar (no hay blacklist ni
sesión server-side) — si un admin es despedido o un cliente reporta robo de
cuenta, su token sigue siendo válido hasta que expire. Se resuelve en la
Fase 4 (Redis: refresh tokens de corta duración + blacklist de tokens
revocados). Aceptado explícitamente como deuda técnica de esta fase, no un
descuido.

### Testing
- Unitarios: `RegisterCustomerUseCase` (email duplicado, camino feliz),
  `LoginUserUseCase` (credenciales inválidas, camino feliz, claim de rol
  correcto en el JWT emitido).
- Integración (testcontainers): `DrizzleUserRepository` — unique constraint
  de email real.
- E2E: registro → login → request a ruta protegida con `@Roles('admin')`
  usando un token de cliente → 403; usando un token de admin (creado vía
  script en el setup del test) → 200. `JwtAuthGuard` sin token → 401.

---

## Fase 2 (ya diseñada en el spec anterior, referencia)

Los endpoints de escritura de `catalog`/`pricing` del spec del 2026-08-30 se
implementan igual que estaban diseñados, cambiando únicamente el guard:
`@UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin')` en vez del
`AdminAuthGuard` standalone que proponía ese documento (ya no existe un
módulo `admin` separado — pasa a vivir en `users`).

## Fase 3 (roadmap, sin especificar todavía)

- Favoritos: tabla `favorites(user_id, product_id, created_at)`.
- Tarjetas guardadas: **nunca** persistir PAN/CVV — tokenizar contra el
  proveedor de pago ya presente en el proyecto (`PAYMENT_PROVIDER`:
  webpay/flow), guardando solo el token/referencia que el proveedor
  devuelve.
- Historial de búsqueda: evaluar reusar `analytics_events` (ya tiene
  `event_type`, `payload jsonb`, `visitor_id`) en vez de una tabla nueva,
  agregando `user_id` opcional para atribuir el evento a un cliente logueado.
- Vincular carrito de visitante a cuenta de cliente al loguearse (merge o
  reemplazo del carrito anónimo).
- Recomendaciones personalizadas por historial de vistas: extiende
  `GetRecommendationsUseCase` (hoy solo por categoría/popularidad) — necesita
  su propio diseño, probablemente depende de tener primero el historial de
  búsqueda/vistas de la Fase 3.

## Fase 4 (roadmap, sin especificar todavía)

- Redis para sesiones revocables (refresh tokens de corta duración +
  blacklist de tokens revocados en logout/baneo).
- Redis como cache de catálogo (lecturas de alto tráfico).
