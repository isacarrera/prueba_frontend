import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators'; // ✅ IMPORTACIÓN NECESARIA

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
  private currentInventaryIdSubject = new BehaviorSubject<number | null>(null);
  public currentInventaryId$ = this.currentInventaryIdSubject.asObservable();
  
  private scannedItems = new Set<number>();

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
    this.scannedItems.clear();
  }

  getInventaryId(): number | null {
    return this.currentInventaryIdSubject.value;
  }

  // ✅ ESCANEAR ITEM - CORREGIDO CON LA ESTRUCTURA REAL
// En inventory.service.ts - ACTUALIZA el método scan
// En el método scan del servicio - esto ya debería estar
scan(scanRequest: ScanRequestDto): Observable<ScanResponseDto> {
  return this.http.post<ScanResponseDto>(`${this.baseUrl}/scan`, scanRequest)
    .pipe(
      tap((response: ScanResponseDto) => {
        // ✅ Esto marca automáticamente el item cuando el escaneo es exitoso
        if (response.isValid && response.itemId && response.status === 'Correct') {
          this.addScannedItem(response.itemId);
          console.log('✅ Item escaneado automáticamente:', response.itemId);
        }
      })
    );
}
  addScannedItem(itemId: number): void {
    this.scannedItems.add(itemId);
    console.log('📦 Item agregado a escaneados:', itemId, 'Total:', this.scannedItems.size);
  }

  isItemScanned(itemId: number): boolean {
    return this.scannedItems.has(itemId);
  }

  getScannedItems(): number[] {
    return Array.from(this.scannedItems);
  }

  clearScannedItems(): void {
    this.scannedItems.clear();
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

  getStateItems(): StateItem[] {
    return STATE_ITEMS;
  }
}