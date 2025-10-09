// models/scan-response.model.ts
export interface ScanResponseDto {
  isValid: boolean;
  status: 'Correct' | 'WrongZone' | 'NotFound' | 'Duplicate';
  message: string;
  itemId?: number;
}