/**
 * Cursor opaco para el listado de productos: base64url de
 * {createdAt, id}, respaldado por el índice
 * idx_products_status_created_at (status, created_at desc, id).
 */
export interface ProductListCursor {
  createdAt: string; // ISO 8601
  id: string;
}

export function encodeCursor(cursor: ProductListCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function decodeCursor(raw: string): ProductListCursor | null {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      typeof (parsed as Record<string, unknown>).createdAt === 'string' &&
      typeof (parsed as Record<string, unknown>).id === 'string'
    ) {
      return parsed as ProductListCursor;
    }
    return null;
  } catch {
    return null;
  }
}
