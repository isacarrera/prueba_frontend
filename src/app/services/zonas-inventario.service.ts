import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { ZonaInventarioBranch, StateZone, StateZoneLabels, StateZoneIcons } from '../Interfaces/zone.model';

// Interface para la respuesta del API
interface ZoneApiResponse {
  id: number;
  name: string;
  description: string;
  stateZone: string; // Viene como string del backend
  branchId: number;
  branchName: string;
  companyName: string;
}

@Injectable({
  providedIn: 'root'
})
export class ZonasInventarioService {

  private urlBase = environment.apiURL + 'api/Zone'

  constructor(private http: HttpClient) { }

  getZonas(userId: number): Observable<ZonaInventarioBranch[]> {
    return this.http.get<ZoneApiResponse[]>(`${this.urlBase}/user/${userId}`)
      .pipe(
        map(zones => zones.map(zone => this.mapZoneFromApi(zone)))
      );
  }

  getById(zoneId: number): Observable<any> {
    return this.http.get(`${this.urlBase}/GetById/${zoneId}`);
  }

  private mapZoneFromApi(zoneApi: ZoneApiResponse): ZonaInventarioBranch {
    const stateZoneNum = this.parseStateZone(zoneApi.stateZone);

    return {
      id: zoneApi.id,
      name: zoneApi.name,
      branchId: zoneApi.branchId,
      isAvailable: stateZoneNum === StateZone.Available,
      stateZone: stateZoneNum,
      stateLabel: StateZoneLabels[stateZoneNum],
      iconName: StateZoneIcons[stateZoneNum]
    };
  }

  private parseStateZone(stateZoneString: string): StateZone {
    switch (stateZoneString.toLowerCase()) {
      case 'available': return StateZone.Available;
      case 'ininventory': return StateZone.InInventory;
      case 'inverification': return StateZone.InVerification;
      default: return StateZone.InVerification;
    }
  }
}
