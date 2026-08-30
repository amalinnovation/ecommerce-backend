export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  attributes: Record<string, unknown>;
  stock: number;
}
