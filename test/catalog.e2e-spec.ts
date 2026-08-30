import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/shared/infrastructure/http/global-exception.filter';
import { DB_CLIENT } from '../src/shared/infrastructure/db/db.module';
import type { DbClient } from '../src/shared/infrastructure/db/client';
import { categories, products } from '../src/shared/infrastructure/db/schema';

describe('catalog (e2e)', () => {
  let app: INestApplication;
  let db: DbClient;
  let categoryId: string;
  let productId: string;
  const productSlug = `e2e-product-${Date.now()}`;
  const categorySlug = `e2e-category-${Date.now()}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();

    db = moduleRef.get(DB_CLIENT);
    const [category] = await db.insert(categories).values({ name: 'E2E Category', slug: categorySlug }).returning();
    categoryId = category.id;
    const [product] = await db
      .insert(products)
      .values({ categoryId, slug: productSlug, name: 'E2E Product' })
      .returning();
    productId = product.id;
  });

  afterAll(async () => {
    await db.delete(products).where(eq(products.id, productId));
    await db.delete(categories).where(eq(categories.id, categoryId));
    await app.close();
  });

  it('GET /v1/catalog/categories incluye la categoría de prueba', async () => {
    const res = await request(app.getHttpServer()).get('/v1/catalog/categories');
    expect(res.status).toBe(200);
    expect(res.body.some((c: { slug: string }) => c.slug === categorySlug)).toBe(true);
  });

  it('GET /v1/catalog/products/:slug devuelve el producto sembrado', async () => {
    const res = await request(app.getHttpServer()).get(`/v1/catalog/products/${productSlug}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(productId);
    expect(res.body.variants).toEqual([]);
  });

  it('GET /v1/catalog/products/:slug con un slug inexistente da 404 con el código de dominio', async () => {
    const res = await request(app.getHttpServer()).get('/v1/catalog/products/no-existe-de-verdad');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('catalog.product_not_found');
  });
});
