// models/state-item.model.ts
export interface StateItem {
  id: number;
  name: string;
  description: string;
}

// constants/state-items.constants.ts
export const STATE_ITEMS: StateItem[] = [
  { id: 1, name: 'Disponible', description: 'Item disponible y en estado normal.' },
  { id: 2, name: 'En orden', description: 'Item verificado y en buen estado.' },
  { id: 3, name: 'Reparación', description: 'Item identificado para reparación.' },
  { id: 4, name: 'Dañado', description: 'Item físicamente dañado.' },
  { id: 5, name: 'Perdido', description: 'Item reportado como perdido.' }
];