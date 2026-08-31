import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { buildOpenApiDocument } from './shared/infrastructure/http/openapi-document';

/**
 * Genera openapi.json desde los DTO decorados. No levanta un servidor HTTP
 * real: sólo construye el documento y lo imprime por stdout.
 *
 *   nest build && node dist/openapi.js > openapi.json
 *
 * El frontend genera sus tipos y sus hooks desde este archivo (sección 05
 * del plan de arquitectura). CI falla si openapi.json cambió sin
 * regenerarse — un contrato que se desincroniza en silencio no es un
 * contrato.
 */
async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const document = buildOpenApiDocument(app);
  process.stdout.write(JSON.stringify(document, null, 2));

  await app.close();
}

void generate();
