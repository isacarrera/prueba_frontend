import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

export interface ZonaInventario {
  id: number;
  name: string;
  // description?: string;
  branchId: number;
  // branchName: string;
  // companyName: string;
}

@Injectable({
  providedIn: 'root'
})
export class ZonasInventarioService {

  private urlBase = environment.apiURL + 'api/Zone'
  constructor(private http: HttpClient) {}

  getZonas(userId: number) {
    return this.http.get<ZonaInventario[]>(`${this.urlBase}/user/${userId}`);
  }
  
}
