import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators'; 

import { StartInventoryResponseDto } from '../Interfaces/start-inventory-response.model';
import { ScanRequestDto } from '../Interfaces/scan-request.model';
import { ScanResponseDto } from '../Interfaces/scan-response.model';
import { FinishRequestDto } from '../Interfaces/finish-request.model';
import { STATE_ITEMS, StateItem } from '../Interfaces/state-item.model';
import { environment } from 'src/environments/environment.prod';
import { StartInventoryRequestDto } from '../Interfaces/start-inventory-request.model';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private baseUrl = environment.apiURL + 'api/Inventory';
  private itemApiUrl = environment.apiURL + 'api/Items'; 

  private currentInventaryIdSubject = new BehaviorSubject<number | null>(null);
  public currentInventaryId$ = this.currentInventaryIdSubject.asObservable();
  
  private scannedItems: number[] = [];

  constructor(private http: HttpClient) {}

  start(
    request: StartInventoryRequestDto
  ): Observable<StartInventoryResponseDto> {
    return this.http.post<StartInventoryResponseDto>(
      `${this.baseUrl}/start`,
      request
    );
  }

  setInventaryId(id: number): void {
    this.currentInventaryIdSubject.next(id);
    this.scannedItems = []; 
  }

  getInventaryId(): number | null {
    return this.currentInventaryIdSubject.value;
  }

  // ✅ AQUÍ ESTÁ EL ARREGLO:
  // Quité el .pipe(tap(...)) que añadía el ítem automáticamente.
  // Ahora SÓLO el modal (que tú me enviaste) se encarga de añadir el ítem.
  scan(scanRequest: ScanRequestDto): Observable<ScanResponseDto> {
    return this.http.post<ScanResponseDto>(`${this.baseUrl}/scan`, scanRequest);
  }

  addScannedItem(itemId: number): void {
    this.scannedItems.push(itemId);
    console.log('📦 Item agregado a escaneados:', itemId, 'Total:', this.scannedItems.length);
  }

  isItemScanned(itemId: number): boolean {
    return this.scannedItems.includes(itemId);
  }

  getScannedItems(): number[] {
    return this.scannedItems;
  }

  clearScannedItems(): void {
    this.scannedItems = []; 
  }

  finish(finishRequest: FinishRequestDto): Observable<any> {
    this.clearScannedItems();
    return this.http.post(`${this.baseUrl}/finish`, finishRequest);
  }

  verificationBranch(branchId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/verification/branch/${branchId}`);
  }

  getComparacion(inventaryId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${inventaryId}/compare`);
  }

  confirmarVerificacion(inventaryId: number, observations: string, result: boolean = true): Observable<any> {
    const body = {
      inventaryId,
      result,
      observations
    };
    return this.http.post(`${this.baseUrl}/verify`, body);
  }

  getItemDescription(code: string): Observable<any> {
    return this.http.get(`${this.itemApiUrl}/by-code/${code}`);
  }

  getStateItems(): StateItem[] {
    return STATE_ITEMS;
  }
}