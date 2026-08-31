import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('amal-ecommerce-app API')
    .setDescription('Contrato REST del backend hexagonal')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  return SwaggerModule.createDocument(app, config);
}
