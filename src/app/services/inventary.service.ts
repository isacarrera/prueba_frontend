import { HttpClient } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable, tap } from 'rxjs';

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
    ).pipe(
      tap(async (response) => {
        if (response && response.inventaryId) {
          try {
            console.log(`[Host Flow] Inventario iniciado, uniendo al host al grupo ${response.inventaryId}...`);
            // El Host se une a su propio grupo
            await this.signalrService.joinInventoryGroup(response.inventaryId);
          } catch (err) {
            console.error('[Host Flow] El host no pudo unirse al grupo de SignalR:', err);
          }
        }
      })
    );
  }

  /**
  * Valida y une a un invitado a un inventario.
  */
  async joinInventory(invitationCode: string): Promise<{ zoneId: number, inventaryId: number }> {
    const requestBody = { invitationCode };

    try {
      console.log(`[Guest Flow] Validando permiso para CÓDIGO ${invitationCode}...`);
      const response = await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/join`, requestBody)
      );

      // Procesar la NUEVA respuesta del backend
      if (!response || !response.zoneId || !response.inventaryId) {
        throw new Error('La API de validación no devolvió ZoneId o InventaryId.');
      }

      const { zoneId, inventaryId } = response;
      console.log(`[Guest Flow] Validación HTTP exitosa. ZoneId: ${zoneId}, InventaryId: ${inventaryId}`);

      // Unirse al grupo de SignalR (usando el ID que devolvio la API)
      await this.signalrService.joinInventoryGroup(inventaryId);

      // Setear el ID en el servicio para que el ScannerPage lo detecte
      this.setInventaryId(inventaryId);

      // Devolver el objeto para la navegacion
      return { zoneId, inventaryId };

    } catch (error: any) {
      console.error('[Guest Flow] Error al unirse al inventario:', error);

      let cleanErrorMessage = 'Codigo Invalido.';

      if (error?.error) {
        if (typeof error.error === 'string') {
          try {
            const parsedError = JSON.parse(error.error);
            cleanErrorMessage = parsedError?.Message || 'Error al parsear respuesta del servidor.';
          } catch (e) {
            cleanErrorMessage = 'Respuesta de error ilegible del servidor.';
          }
        } else if (error.error.Message) {
          cleanErrorMessage = error.error.Message;
        }
      } else if (error?.message) {
        cleanErrorMessage = error.message;
      }
      throw new Error(cleanErrorMessage);
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
