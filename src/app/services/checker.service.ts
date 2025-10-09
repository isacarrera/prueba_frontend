import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class CheckerService {

  private urlBase = environment.apiURL + 'api/Checker';

  constructor(private http: HttpClient) { }

   GetOperatingId(userId: number): Observable<any> {
    return this.http.get(`${this.urlBase}/GetByUserId/${userId}`);
    }
}
