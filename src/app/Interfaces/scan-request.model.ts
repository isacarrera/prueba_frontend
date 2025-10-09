// models/scan-request.model.ts
export interface ScanRequestDto {
  inventaryId: number;
  code: string;
  stateItemId: number;
}