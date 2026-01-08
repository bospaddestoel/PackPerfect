
export interface CategoryDef {
  id: string;
  name: string;
  icon: string;
  colorClass: string;
}

export interface PackingItem {
  id: string;
  name: string;
  categoryId: string; // Reference to CategoryDef.id
  isPacked: boolean;
  image?: string; // base64
  notes?: string;
}

export interface PackingList {
  id: string;
  name: string;
  items: PackingItem[];
  isTemplate: boolean;
  createdAt: number;
}

export interface Holiday {
  id: string;
  name: string;
  listId: string;
  date?: string;
}

export type AppView = 'dashboard' | 'list-detail' | 'categories';
