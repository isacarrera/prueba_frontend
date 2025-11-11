// src/app/services/item.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

export interface Item {
  id: number;
  code: string;
  name: string;
  description: string;
  categoryItemId: number;
  categoryName: string;
  stateItemId: number;
  stateItemName: string;
  zoneId: number;
  zoneName: string;
  qrPath: string;
}

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private baseUrl = environment.apiURL + 'api/Item';

  constructor(private http: HttpClient) {}

  getByCodeAndBranch(branchId: number, code: string): Observable<Item> {
    return this.http.get<Item>(`${this.baseUrl}/GetByCodeAndBranch/${branchId}/${code}`);
  }
}