import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DB_CLIENT } from '../../../../shared/infrastructure/db/db.module';
import type { DbClient } from '../../../../shared/infrastructure/db/client';
import { carts, cartItems } from '../../../../shared/infrastructure/db/schema';
import type { Cart } from '../../domain/entities/cart.entity';
import type { CartItem } from '../../domain/entities/cart-item.entity';
import type { CartRepositoryPort } from '../../domain/ports/cart-repository.port';

@Injectable()
export class DrizzleCartRepository implements CartRepositoryPort {
  constructor(@Inject(DB_CLIENT) private readonly db: DbClient) {}

  async findOrCreateActiveForVisitor(visitorId: string): Promise<{ cart: Cart; items: CartItem[] }> {
    const [existing] = await this.db
      .select()
      .from(carts)
      .where(and(eq(carts.visitorId, visitorId), eq(carts.status, 'active')))
      .limit(1);

    const cartRow = existing ?? (await this.db.insert(carts).values({ visitorId }).returning())[0];
    const itemRows = await this.db.select().from(cartItems).where(eq(cartItems.cartId, cartRow.id));

    return { cart: toCartDomain(cartRow), items: itemRows.map(toCartItemDomain) };
  }

  async addItem(cartId: string, variantId: string, quantity: number): Promise<CartItem> {
    const [row] = await this.db
      .insert(cartItems)
      .values({ cartId, variantId, quantity })
      .onConflictDoUpdate({
        target: [cartItems.cartId, cartItems.variantId],
        // "excluded" es la fila propuesta del INSERT — así se suma a la
        // cantidad que ya había, en vez de reemplazarla.
        set: { quantity: sql`${cartItems.quantity} + excluded.quantity`, updatedAt: new Date().toISOString() },
      })
      .returning();
    return toCartItemDomain(row);
  }

  async setItemQuantity(cartItemId: string, quantity: number): Promise<CartItem> {
    const [row] = await this.db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date().toISOString() })
      .where(eq(cartItems.id, cartItemId))
      .returning();
    return toCartItemDomain(row);
  }

  async removeItem(cartItemId: string): Promise<void> {
    await this.db.delete(cartItems).where(eq(cartItems.id, cartItemId));
  }

  async findItemForVisitor(cartItemId: string, visitorId: string): Promise<CartItem | null> {
    const [row] = await this.db
      .select({ item: cartItems })
      .from(cartItems)
      .innerJoin(carts, eq(carts.id, cartItems.cartId))
      .where(and(eq(cartItems.id, cartItemId), eq(carts.visitorId, visitorId)))
      .limit(1);
    return row ? toCartItemDomain(row.item) : null;
  }

  async findItems(cartId: string): Promise<CartItem[]> {
    const rows = await this.db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
    return rows.map(toCartItemDomain);
  }
}

function toCartDomain(row: typeof carts.$inferSelect): Cart {
  return { id: row.id, visitorId: row.visitorId, status: row.status as Cart['status'] };
}

function toCartItemDomain(row: typeof cartItems.$inferSelect): CartItem {
  return { id: row.id, cartId: row.cartId, variantId: row.variantId, quantity: row.quantity };
}
