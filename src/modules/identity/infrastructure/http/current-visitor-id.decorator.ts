import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Lee `req.visitorId`, puesto ahí por VisitorCookieMiddleware. Si falta,
 * es un error de cableado (el middleware no corrió en esa ruta), no un
 * caso de negocio — por eso 500, no un DomainError.
 */
export const CurrentVisitorId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<Request>();
  if (!req.visitorId) {
    throw new InternalServerErrorException(
      'req.visitorId no está definido — ¿la ruta está excluida de VisitorCookieMiddleware?',
    );
  }
  return req.visitorId;
});
