import { IsInt, IsUUID, Max, Min } from 'class-validator';

/**
 * A propósito NO tiene price/total/discount — la regla de oro (sección
 * 12 del documento de arquitectura). Con ValidationPipe({ whitelist:
 * true, forbidNonWhitelisted: true }) ya activo en main.ts, cualquier
 * campo extra en el body da 400 automático.
 */
export class AddCartItemDto {
  @IsUUID()
  variantId!: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}
