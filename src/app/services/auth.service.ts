import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment.prod';
import { IdleService } from './idle.service';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiURL + 'api/Auth';

  constructor(
        private http: HttpClient,
        public storage: Storage,
        private idleService: IdleService
    ) {
    this.storage.create();

    this.idleService.logout$.subscribe(() => {
        this.logout();
    });
}

  async init() {
    // Inicializa el motor de Storage
    this.storage = await this.storage.create();
  }

 login(username: string, password: string) {
  return this.http.post<any>(`${this.apiUrl}/Login`, { username, password }).pipe(
    tap(async (res) => {
      if (res.token && res.refreshToken) {
        await this.storage.set('access_token', res.token);
        await this.storage.set('refresh_token', res.refreshToken);
        this.idleService.startWatching();
      }
    })
  );
}
  loginOperativo(documentType: string, documentNumber: string) {
  return this.http.post<any>(`${this.apiUrl}/LoginOperativo`, {
      documentType,
      documentNumber
    })
    .pipe(
      tap(async (res) => {
        if (res.token && res.refreshToken) {
          await this.storage.set('access_token', res.token);
          await this.storage.set('refresh_token', res.refreshToken);
          this.idleService.startWatching();
        }
      })
    );
 }
 async getUserFromToken() {
  const token = await this.getAccessToken();
  if (!token) return null;

  const decoded: any = jwtDecode(token);
  return {
    userId: decoded['nameid'],    
    personId: decoded['personId'],
    username: decoded['unique_name'],
    role: decoded['role']
  };
}
  async getAccessToken() {
    return await this.storage.get('access_token');
  }

  async getRefreshToken() {
    return await this.storage.get('refresh_token');
  }

  async logout() {
    this.idleService.stopWatching();
    await this.storage.remove('access_token');
    await this.storage.remove('refresh_token');
  }
  refreshToken(refreshToken: string) {
  return this.http.post<any>(`${this.apiUrl}/refresh`, { refreshToken });
}

}
