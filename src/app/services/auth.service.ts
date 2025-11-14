import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment.prod';
import { IdleService } from './idle.service';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiURL + 'api/Auth';
  private _storageReady = false;

  constructor(
    private http: HttpClient,
    private storage: Storage,
    private idleService: IdleService
  ) { }

  /** Inicializa el motor de almacenamiento */
  async init(): Promise<void> {
    if (!this._storageReady) {
      await this.storage.create();
      this._storageReady = true;
      // console.log('🗄️ Ionic Storage inicializado correctamente');
    }
  }

  /** Guarda tokens después del login */
  login(username: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/Login`, { username, password }).pipe(
      tap(async (res) => {
        if (res.token && res.refreshToken) {
          await this.init(); // ⚠️ asegúrate de que esté listo
          await this.storage.set('access_token', res.token);
          await this.storage.set('refresh_token', res.refreshToken);
          // console.log('✅ Tokens guardados en Ionic Storage');
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
    // 👇 MOVEMOS toda la lógica al switchMap para manejar tanto success como errors
    switchMap(async (res) => {
      await this.init();

      // Si el backend responde con success: false pero código HTTP 200
      if (res.success === false) {
        throw new Error(res.message || 'Acceso denegado');
      }

      // Si no trae tokens, también es error
      if (!res.token || !res.refreshToken) {
        throw new Error('El servidor no envió los tokens');
      }

      // 👇 GUARDAR TOKENS solo si es exitoso
      await this.storage.set('access_token', res.token);
      await this.storage.set('refresh_token', res.refreshToken);
      this.idleService.startWatching();

      // Devolvemos la respuesta para el next()
      return res;
    }),
    catchError((error: HttpErrorResponse) => {
      // 👇 MANEJAMOS ERRORES HTTP (401, 403, 500, etc.)
      if (error.status === 401 || error.status === 403) {
        // Para 401/403, el backend envía el mensaje en error.error
        const message = error.error?.message || error.message;
        throw new Error(message);
      } else {
        // Otros errores (conexión, servidor, etc.)
        throw new Error('Problema de conexión. Intenta nuevamente.');
      }
    })
  );
}


  async getAccessToken() {
    await this.init();
    const token = await this.storage.get('access_token');
    // console.log('🔐 Token leído de Storage:', token);
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
