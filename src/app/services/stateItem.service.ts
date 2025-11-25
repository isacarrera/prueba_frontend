// src/app/services/item.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { StateItem } from '../Interfaces/state-item.model';

@Injectable({
    providedIn: 'root'
})
export class StateItemService {
    private baseUrl = environment.apiURL + 'api/StateItem';

    private cache: StateItem[] | null = null;

    constructor(private http: HttpClient) { }

    getStateItems(): Observable<StateItem[]> {
        if (this.cache) {
            return of(this.cache);
        }

        return this.http.get<StateItem[]>(`${this.baseUrl}/GetAll`).pipe(
            tap(states => this.cache = states)
        );
    }

}
