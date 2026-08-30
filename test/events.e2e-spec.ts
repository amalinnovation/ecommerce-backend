import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/shared/infrastructure/http/global-exception.filter';

describe('POST /v1/events (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('un lote válido devuelve 204 sin cuerpo', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/events')
      .send({ events: [{ eventType: 'product.viewed', payload: { productId: 'abc' } }] });
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it('un lote de más de 50 eventos da 400', async () => {
    const events = Array.from({ length: 51 }, () => ({ eventType: 'product.viewed' }));
    const res = await request(app.getHttpServer()).post('/v1/events').send({ events });
    expect(res.status).toBe(400);
  });

  it('un lote vacío da 400', async () => {
    const res = await request(app.getHttpServer()).post('/v1/events').send({ events: [] });
    expect(res.status).toBe(400);
  });
});
