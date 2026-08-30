import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { GetOrCreateVisitorUseCase } from '../../application/use-cases/get-or-create-visitor.use-case';

export const ANON_ID_COOKIE = 'anon_id';

// Augmentación global (no de un módulo con nombre): `@types/express`
// declara `namespace Express` globalmente, y este patrón le agrega
// `visitorId` sin depender de que 'express-serve-static-core' sea
// resoluble como specifier (con pnpm, no siempre lo es).
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      visitorId?: string;
    }
  }
}

/**
 * Se ejecuta después de cookie-parser (ver identity.module.ts). Lee la
 * cookie firmada, reutiliza o crea el visitante, y sólo reescribe la
 * cookie si el id cambió.
 */
@Injectable()
export class VisitorCookieMiddleware implements NestMiddleware {
  constructor(private readonly getOrCreateVisitor: GetOrCreateVisitorUseCase) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    // req.signedCookies[x] === false cuando la firma no valida (cookie
    // manipulada) — se trata igual que "no vino cookie".
    const existingId: string | undefined =
      typeof req.signedCookies?.[ANON_ID_COOKIE] === 'string' ? req.signedCookies[ANON_ID_COOKIE] : undefined;

    const visitor = await this.getOrCreateVisitor.execute(existingId);
    req.visitorId = visitor.id;

    if (visitor.id !== existingId) {
      res.cookie(ANON_ID_COOKIE, visitor.id, {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        signed: true,
        maxAge: 1000 * 60 * 60 * 24 * 400, // ~400 días, techo que respetan los navegadores
      });
    }

    next();
  }
}
