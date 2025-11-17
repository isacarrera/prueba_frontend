export interface MissingItem {
  itemId: number;
  code: string;
  name: string;
  description: string;
  currentState: string;
}

export interface ManualScanEntry {
  itemId: number;
  stateItemId: number;
}
