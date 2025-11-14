export enum StateZone {
  Available = 1,
  InInventory = 2,
  InVerification = 3
}

export const StateZoneLabels = {
  [StateZone.Available]: 'Disponible',
  [StateZone.InInventory]: 'En Inventario',
  [StateZone.InVerification]: 'En Verificación'
};


export const StateZoneIcons = {
  [StateZone.Available]: 'lock-open-outline',
  [StateZone.InInventory]: 'lock-close-outline',
  [StateZone.InVerification]: 'shield-checkmark-outline'
};

export interface ZonaInventario {
  id: number;
  name: string;
  // description?: string;
  branchId: number;
  // branchName: string;
  // companyName: string;
}

export interface ZonaInventarioBranch {
  id: number;
  name: string;
  branchId: number;
  isAvailable: boolean;
  stateZone: StateZone;
  stateLabel: string;
  iconName: string;
}
