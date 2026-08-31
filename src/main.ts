import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/infrastructure/http/global-exception.filter';
import { buildOpenApiDocument } from './shared/infrastructure/http/openapi-document';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  // Un campo de más en el cuerpo debe ser un 400, no un valor ignorado
  // en silencio (ver sección 12 del plan de arquitectura).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  if (process.env.NODE_ENV !== 'production') {
    const document = buildOpenApiDocument(app);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT ?? 5000;
  await app.listen(port);
}

void bootstrap();
