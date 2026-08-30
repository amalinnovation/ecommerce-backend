export interface Category {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  position: number;
}

export interface CategoryNode extends Category {
  children: CategoryNode[];
}
