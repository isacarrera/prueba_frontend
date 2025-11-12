import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment.prod';
import { IdleService } from './idle.service';
import { jwtDecode } from 'jwt-decode';
import { SignalrService } from './socket/signalr.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiURL + 'api/Auth';
  private _storageReady = false;

  constructor(
    private http: HttpClient,
    private storage: Storage,
    private idleService: IdleService
  ) { }

  private readonly signalrService = inject(SignalrService)

  /** Inicializa el motor de almacenamiento */
  async init(): Promise<void> {
    if (!this._storageReady) {
      await this.storage.create();
      this._storageReady = true;
      // console.log('Ionic Storage inicializado correctamente');
    }
  }

  /** Guarda tokens después del login */
  login(username: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/Login`, { username, password }).pipe(
      tap(async (res) => {
        if (res.token && res.refreshToken) {
          await this.init(); // Se asegura de que este listo
          await this.storage.set('access_token', res.token);
          await this.storage.set('refresh_token', res.refreshToken);
          // console.log('Tokens guardados en Ionic Storage');
          this.idleService.startWatching();
        }
      })
    );
  }

  loginOperativo(documentType: string, documentNumber: string) {
    return this.http.post<any>(`${this.apiUrl}/LoginOperativo`, {
      documentType,
      documentNumber
    }).pipe(
      tap(async (res) => {
        if (res.token && res.refreshToken) {
          await this.init(); // Asegura que el storage este listo
          await this.storage.set('access_token', res.token);
          await this.storage.set('refresh_token', res.refreshToken);
          // console.log('Login operativo: tokens guardados');
          this.idleService.startWatching();

          this.signalrService.startConnection().catch(err => {
            console.error('Fallo al iniciar SignalR post-login operativo', err);
          });
        }
      })
    );
  }

  async getAccessToken() {
    await this.init();
    const token = await this.storage.get('access_token');
    // console.log('Token leido de Storage:', token);
    return token;
  }

  async getRefreshToken() {
    await this.init();
    return await this.storage.get('refresh_token');
  }

    async logout() {
    await this.init();
    await this.storage.remove('access_token');
    await this.storage.remove('refresh_token');
    this.idleService.stopWatching();

    this.signalrService.stopConnection();
  }

  refreshToken(refreshToken: string) {
    return this.http.post<any>(`${this.apiUrl}/refresh`, { refreshToken });
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
}
