// src/app/models/start-inventory-request.model.ts
export interface StartInventoryRequestDto {
  zoneId: number;
  operatingGroupId: number;
  observations?: string; // opcional
}