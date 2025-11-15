import { HttpClient } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';

import { environment } from 'src/environments/environment.prod';
import { FinishRequestDto } from '../Interfaces/finish-request.model';
import { ScanRequestDto } from '../Interfaces/scan-request.model';
import { ScanResponseDto } from '../Interfaces/scan-response.model';
import { StartInventoryRequestDto } from '../Interfaces/start-inventory-request.model';
import { StartInventoryResponseDto } from '../Interfaces/start-inventory-response.model';
import { SignalrService } from './Connections/signalr.service';

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

  private _signalrService: SignalrService | null = null;

  constructor(
    private http: HttpClient,
    private injector: Injector
  ) { }

  /**
   * Resuelve perezosamente SignalrService para evitar dependencias circulares
   * (ej: AuthService -> SignalrService -> InventoryService -> AuthService)
   */
  public get signalrService(): SignalrService {
    if (!this._signalrService) {
      this._signalrService = this.injector.get(SignalrService);
    }
    return this._signalrService;
  }

  start(
    request: StartInventoryRequestDto
  ): Observable<StartInventoryResponseDto> {
    return this.http.post<StartInventoryResponseDto>(
      `${this.baseUrl}/start`,
      request
    );
  }

  /**
  * Valida y une a un invitado a un inventario.
  */
  async joinInventory(inventaryId: number): Promise<number> {
    const requestBody = { inventaryId };

    try {
      // Validar permiso via HTTP (POST /join)
      const response = await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/join`, requestBody)
      );

      if (!response || !response.zoneId) {
        throw new Error('La API de validación no devolvió un ZoneId.');
      }

      const zoneId = response.zoneId;

      // Unirse al grupo de SignalR (Invoke Hub)
      await this.signalrService.joinInventoryGroup(inventaryId);

      // Setear el ID en el servicio para que el ScannerPage lo detecte
      this.setInventaryId(inventaryId);

      // Devolver el ZoneId para la navegación
      return zoneId;

    } catch (error: any) {
      console.error('[Guest Flow] Error al unirse al inventario:', error);

      // Re-lanzar el error para que el componente de UI lo maneje
      const errorMessage = error?.error?.Message || error?.message || 'Error desconocido al unirse.';
      throw new Error(errorMessage);
    }
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

    if (currentSet.has(itemId)) {
      return;
    }

    const newSet = new Set(currentSet);
    newSet.add(itemId);

    this.scannedItemsSubject.next(newSet);
  }

  isItemScanned(itemId: number): boolean {
    return this.scannedItemsSubject.value.has(itemId);
  }

  getScannedItems(): number[] {
    return Array.from(this.scannedItemsSubject.value);
  }

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
