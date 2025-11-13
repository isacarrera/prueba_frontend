// src/app/Interfaces/state-item.model.ts
export interface StateItem {
  id: number;
  name: string;
  description: string;
}

export const STATE_ITEMS: StateItem[] = [
  {
    id: 1,
    name: 'En orden',
    description: 'Item verificado y en buen estado.',
  },
  {
    id: 2,
    name: 'Reparacion',
    description: 'Item identificado para reparacion.',
  },
  {
    id: 3,
    name: 'Danado',
    description: 'Item fisicamente danado.',
  },
  {
    id: 4,
    name: 'Perdido',
    description: 'Item reportado como perdido.',
  },
];
