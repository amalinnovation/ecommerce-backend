export class VariantPriceDto {
  amount!: string;
  offerAmount!: string | null;
  available!: number;
}

export class ProductVariantDto {
  id!: string;
  sku!: string;
  attributes!: Record<string, unknown>;
  stock!: number;
  /** null si la variante no tiene un período de precio vigente ahora mismo. */
  price!: VariantPriceDto | null;
}

export class ProductDetailDto {
  id!: string;
  slug!: string;
  name!: string;
  description!: string | null;
  categoryId!: string;
  variants!: ProductVariantDto[];
}
