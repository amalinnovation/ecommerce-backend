import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/infrastructure/http/global-exception.filter';

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

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

void bootstrap();
