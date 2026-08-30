import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/shared/infrastructure/http/global-exception.filter';
import { DB_CLIENT } from '../src/shared/infrastructure/db/db.module';
import type { DbClient } from '../src/shared/infrastructure/db/client';
import { categories, products, productVariants, prices } from '../src/shared/infrastructure/db/schema';

describe('cart (e2e)', () => {
  let app: INestApplication;
  let db: DbClient;
  let categoryId: string;
  let productId: string;
  let variantId: string;
  let cookie: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();

    db = moduleRef.get(DB_CLIENT);
    const suffix = Date.now();
    const [category] = await db
      .insert(categories)
      .values({ name: 'E2E Cart Category', slug: `e2e-cart-category-${suffix}` })
      .returning();
    categoryId = category.id;
    const [product] = await db
      .insert(products)
      .values({ categoryId, slug: `e2e-cart-product-${suffix}`, name: 'E2E Cart Product' })
      .returning();
    productId = product.id;
    const [variant] = await db
      .insert(productVariants)
      .values({ productId, sku: `E2E-CART-${suffix}`, stock: 2 })
      .returning();
    variantId = variant.id;
    await db.insert(prices).values({ variantId, amount: '10000.00' });
  });

  afterAll(async () => {
    await db.delete(prices).where(eq(prices.variantId, variantId));
    await db.delete(productVariants).where(eq(productVariants.id, variantId));
    await db.delete(products).where(eq(products.id, productId));
    await db.delete(categories).where(eq(categories.id, categoryId));
    await app.close();
  });

  it('la primera visita crea una cookie de visitante httpOnly/SameSite=Lax', async () => {
    const res = await request(app.getHttpServer()).get('/v1/cart');
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);

    const setCookie = res.headers['set-cookie'] as unknown as string[];
    expect(setCookie).toBeDefined();
    expect(setCookie[0]).toContain('HttpOnly');
    expect(setCookie[0]).toContain('SameSite=Lax');
    cookie = setCookie[0].split(';')[0];
  });

  it('agregar, actualizar y borrar una línea funciona con la misma cookie', async () => {
    const added = await request(app.getHttpServer())
      .post('/v1/cart/items')
      .set('Cookie', cookie)
      .send({ variantId, quantity: 1 });
    expect(added.status).toBe(201);
    expect(added.body.items).toHaveLength(1);
    expect(added.body.items[0].unitPrice).toBe('10000.00');
    const cartItemId = added.body.items[0].cartItemId;

    const updated = await request(app.getHttpServer())
      .patch(`/v1/cart/items/${cartItemId}`)
      .set('Cookie', cookie)
      .send({ quantity: 2 });
    expect(updated.status).toBe(200);
    expect(updated.body.items[0].quantity).toBe(2);
    expect(updated.body.subtotal).toBe('20000.00');

    const removed = await request(app.getHttpServer())
      .delete(`/v1/cart/items/${cartItemId}`)
      .set('Cookie', cookie);
    expect(removed.status).toBe(200);
    expect(removed.body.items).toEqual([]);
  });

  it('un body con price extra da 400 — la regla de oro no se puede burlar por HTTP', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/cart/items')
      .set('Cookie', cookie)
      .send({ variantId, quantity: 1, price: 1 });
    expect(res.status).toBe(400);
  });

  it('pedir más unidades que el stock disponible da 409', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/cart/items')
      .set('Cookie', cookie)
      .send({ variantId, quantity: 99 });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('cart.variant_out_of_stock');
  });
});
