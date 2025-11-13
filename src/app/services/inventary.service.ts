import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { environment } from 'src/environments/environment.prod';
import { FinishRequestDto } from '../Interfaces/finish-request.model';
import { ScanRequestDto } from '../Interfaces/scan-request.model';
import { ScanResponseDto } from '../Interfaces/scan-response.model';
import { StartInventoryRequestDto } from '../Interfaces/start-inventory-request.model';
import { StartInventoryResponseDto } from '../Interfaces/start-inventory-response.model';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private baseUrl = environment.apiURL + 'api/Inventory';
  private itemApiUrl = environment.apiURL + 'api/Items';

  private currentInventaryIdSubject = new BehaviorSubject<number | null>(null);
  public currentInventaryId$ = this.currentInventaryIdSubject.asObservable();

  private scannedItemsSubject = new BehaviorSubject<Set<number>>(new Set());
  public scannedItems$ = this.scannedItemsSubject.asObservable();

  // private scannedItems: number[] = [];

  constructor(private http: HttpClient) { }

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
  this.clearScannedItems();
}

  getInventaryId(): number | null {
    return this.currentInventaryIdSubject.value;
  }


  scan(scanRequest: ScanRequestDto): Observable<ScanResponseDto> {
    return this.http.post<ScanResponseDto>(`${this.baseUrl}/scan`, scanRequest);
  }

  addScannedItem(itemId: number): void {
    const currentSet = this.scannedItemsSubject.value;

    // El Set maneja duplicados automáticamente, pero validamos por si acaso
    if (currentSet.has(itemId)) {
      return;
    }

    // Creamos un nuevo Set para mantener la inmutabilidad y forzar la detección
    const newSet = new Set(currentSet);
    newSet.add(itemId);

    console.log('📦 [Inventario] Item agregado por Socket:', itemId);
    this.scannedItemsSubject.next(newSet); // Emitimos el nuevo valor
  }

  // Modificamos isItemScanned para leer el valor actual del Subject
  isItemScanned(itemId: number): boolean {
    // Leemos el valor síncrono actual del Set
    return this.scannedItemsSubject.value.has(itemId);
  }

  // Modificamos getScannedItems para leer el valor actual
  getScannedItems(): number[] {
    // Convertimos el Set (valor actual) a un Array
    return Array.from(this.scannedItemsSubject.value);
  }

  // Modificamos clearScannedItems para resetear el Subject
  clearScannedItems(): void {
    this.scannedItemsSubject.next(new Set());
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

}
