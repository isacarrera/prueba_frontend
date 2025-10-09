// services/inventory.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
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

  constructor(private http: HttpClient) {}

  // En inventary.service.ts
  start(
    request: StartInventoryRequestDto
  ): Observable<StartInventoryResponseDto> {
    return this.http.post<StartInventoryResponseDto>(
      `${this.baseUrl}/start`,
      request
    );
  }

  // Guardar el inventaryId en el servicio
  setInventaryId(id: number): void {
    this.currentInventaryIdSubject.next(id);
  }

  // Obtener el inventaryId actual
  getInventaryId(): number | null {
    return this.currentInventaryIdSubject.value;
  }

  // Escanear item
  scan(scanRequest: ScanRequestDto): Observable<ScanResponseDto> {
    return this.http.post<ScanResponseDto>(`${this.baseUrl}/scan`, scanRequest);
  }

  // Finalizar inventario
  finish(finishRequest: FinishRequestDto): Observable<any> {
    return this.http.post(`${this.baseUrl}/finish`, finishRequest);
  }

  verificationBranch(branchId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/verification/branch/${branchId}`);
  }

  getComparacion(inventaryId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${inventaryId}/compare`);
  }

  // src/app/services/inventory.service.ts

confirmarVerificacion(inventaryId: number, observations: string, result: boolean = true): Observable<any> {
  const body = {
    inventaryId,
    result,
    observations
  };
  return this.http.post(`${this.baseUrl}/verify`, body);
}

  // Obtener estados disponibles
  getStateItems(): StateItem[] {
    return STATE_ITEMS;
  }
}
