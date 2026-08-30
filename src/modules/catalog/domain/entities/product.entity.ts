export type ProductStatus = 'active' | 'draft' | 'archived';

export interface Product {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  description: string | null;
  status: ProductStatus;
  isFeatured: boolean;
  createdAt: Date;
}
