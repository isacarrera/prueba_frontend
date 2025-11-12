// --- Modelos para el endpoint Notification/InventoryRequest ---

export interface InventoryDifference {
  itemId: number;
  code: string;
  name: string;
  category: string;
  baseState: string;
  inventoryState: string;
}

export interface InventoryNotificationContent {
  inventaryId: number;
  inventaryDate: string;
  operatingGroupName: string;
  checkerName: string;
  checkerObservation: string;
  differences: InventoryDifference[];
}

export interface InventoryNotificationRequest {
  userId: number;
  content: InventoryNotificationContent;
}
