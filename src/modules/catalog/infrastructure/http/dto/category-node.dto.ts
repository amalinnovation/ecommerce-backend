export class CategoryNodeDto {
  id!: string;
  name!: string;
  slug!: string;
  position!: number;
  children!: CategoryNodeDto[];
}
