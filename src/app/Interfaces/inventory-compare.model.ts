// --- Modelos base de la comparación de inventario ---

export interface InventoryCompareItem {
  itemId: number;
  code: string;
  name: string;
  reason?: string;
  suggestedAction?: string;
  expectedState?: string;
  scannedState?: string;
}

export interface InventoryCompareResponse {
  inventaryId: number;
  missingItems: InventoryCompareItem[];
  unexpectedItems: InventoryCompareItem[];
  stateMismatches: InventoryCompareItem[];
  shortSummary?: string;
  operatingGroupName?: string;
  checkerName?: string;
  zoneManagerId?: number;
}
