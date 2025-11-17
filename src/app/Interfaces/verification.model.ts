export interface VerificationListUpdate {
  inventaryId: number;
  date: string;
  zoneId: number;
  zoneName: string;
  branchId: number;
  updateType: 'Added' | 'Removed';
}
