import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

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

  const config = new DocumentBuilder()
    .setTitle('amal-ecommerce-app API')
    .setDescription('Contrato REST del backend hexagonal')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  process.stdout.write(JSON.stringify(document, null, 2));

  await app.close();
}

void generate();
