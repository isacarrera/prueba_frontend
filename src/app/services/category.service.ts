import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private urlBase = environment.apiURL + 'api/Category';

  constructor(private http: HttpClient) { }

  getItemsByCategory(zonaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlBase}/GetItemsByCategory/${zonaId}`);
  }

}
