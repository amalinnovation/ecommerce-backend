import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.schema';
import { createDbClient } from './client';

export const DB_CLIENT = Symbol('DB_CLIENT');

/**
 * Único lugar que crea la conexión de Drizzle. @Global() para que cada
 * repositorio de cada módulo pueda inyectar DB_CLIENT sin que su .module.ts
 * tenga que importar DbModule explícitamente.
 */
@Global()
@Module({
  providers: [
    {
      provide: DB_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        createDbClient(config.get('DATABASE_URL', { infer: true })),
    },
  ],
  exports: [DB_CLIENT],
})
export class DbModule {}
