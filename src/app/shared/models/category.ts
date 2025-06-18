export interface Category {
  id: number;
  name: string;
  parentId: number;
  depth: number;
  children: Category[];
  imageUrl?: string;
}