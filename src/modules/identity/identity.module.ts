import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { GetOrCreateVisitorUseCase } from './application/use-cases/get-or-create-visitor.use-case';
import { VISITOR_REPOSITORY_PORT } from './domain/ports/visitor-repository.port';
import { DrizzleVisitorRepository } from './infrastructure/persistence/visitor.repository';
import { VisitorCookieMiddleware } from './infrastructure/http/visitor-cookie.middleware';

@Module({
  providers: [
    GetOrCreateVisitorUseCase,
    VisitorCookieMiddleware,
    { provide: VISITOR_REPOSITORY_PORT, useClass: DrizzleVisitorRepository },
  ],
  exports: [GetOrCreateVisitorUseCase],
})
export class IdentityModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // process.env directo, no ConfigService inyectado en el constructor
    // del módulo: bajo Test.createTestingModule() (usado en los e2e),
    // Nest no garantiza que la inyección en el constructor de la propia
    // clase de módulo esté resuelta para cuando corre configure() — es
    // una diferencia real de timing frente a NestFactory.create(). Leer
    // process.env acá es seguro porque validateEnv() ya validó
    // COOKIE_SECRET (zod, min 32) antes de que cualquier configure() de
    // cualquier módulo llegue a ejecutarse.
    consumer
      .apply(cookieParser(process.env.COOKIE_SECRET), VisitorCookieMiddleware)
      // /v1/health no necesita visitante — lo excluimos para no ensuciar
      // los checks de infraestructura con cookies ni escrituras a la DB.
      .exclude('v1/health')
      .forRoutes('*');
  }
}
