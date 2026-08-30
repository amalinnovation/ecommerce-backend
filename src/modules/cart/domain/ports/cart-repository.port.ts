import type { Cart } from '../entities/cart.entity';
import type { CartItem } from '../entities/cart-item.entity';

export const CART_REPOSITORY_PORT = Symbol('CART_REPOSITORY_PORT');

export interface CartRepositoryPort {
  findOrCreateActiveForVisitor(visitorId: string): Promise<{ cart: Cart; items: CartItem[] }>;
  /** Upsert: si la variante ya está en el carrito, SUMA la cantidad. */
  addItem(cartId: string, variantId: string, quantity: number): Promise<CartItem>;
  /** Reemplaza la cantidad (no suma) — es lo que hace PATCH. */
  setItemQuantity(cartItemId: string, quantity: number): Promise<CartItem>;
  removeItem(cartItemId: string): Promise<void>;
  /**
   * null si el ítem no existe O si es de otro visitante — deliberadamente
   * no se distingue, para no filtrar existencia entre visitantes.
   */
  findItemForVisitor(cartItemId: string, visitorId: string): Promise<CartItem | null>;
  findItems(cartId: string): Promise<CartItem[]>;
}
