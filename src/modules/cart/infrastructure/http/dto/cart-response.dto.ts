export class CartLineDto {
  cartItemId!: string;
  variantId!: string;
  quantity!: number;
  unitPrice!: string | null;
  lineTotal!: string | null;
  priceUnavailable!: boolean;
}

export class CartResponseDto {
  cartId!: string;
  status!: string;
  items!: CartLineDto[];
  subtotal!: string;
}
