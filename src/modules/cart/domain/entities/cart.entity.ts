export type CartStatus = 'active' | 'abandoned' | 'converted';

export interface Cart {
  id: string;
  visitorId: string;
  status: CartStatus;
}
