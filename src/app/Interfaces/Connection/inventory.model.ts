export interface InventoryItem {
  id: number;
  name: string;
  description: string;
  // Estado local anadido por el servicio
  completado: boolean;
}

export interface InventoryCategory {
  id: number;
  name: string;
  contador: number; // Total de items en esta categoria
  items: InventoryItem[];
  // Estado local agraegado por el servicio
  scannedCount: number;
}

// Modelo del payload que se espera del backend via SignalR
export interface ItemScannedPayload {
  itemId: number;
  categoryId: number;
  status: 'Correct' | 'WrongZone' | 'NotFound' | 'Duplicate';
  // Se pueden anadir mas campos si el backend los envia
}
