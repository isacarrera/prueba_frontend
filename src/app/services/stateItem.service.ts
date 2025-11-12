// src/app/services/item.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { StateItem } from '../Interfaces/state-item.model';

@Injectable({
    providedIn: 'root'
})
export class StateItemService {
    private baseUrl = environment.apiURL + 'api/StateItem';

    constructor(private http: HttpClient) { }

    getStateItems(): Observable<StateItem[]> {
        return this.http.get<StateItem[]>(`${this.baseUrl}/GetAll`);
    }

}
