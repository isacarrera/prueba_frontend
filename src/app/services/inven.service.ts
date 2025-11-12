
// src/app/services/item.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment.prod';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class InvenService {
    private baseUrl = environment.apiURL + 'api';

    constructor(private http: HttpClient) { }

    getById(inventaryId: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/Inventary/GetById/${inventaryId}`);
    }
}


