import { AuthService } from '../auth.service';
import { inject, Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from 'src/environments/environment.prod';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {

  private hubConnection!: signalR.HubConnection;

  // Uso de una promesa de conexión para evitar "race conditions"
  // si multiples servicios intentan conectar a la vez.
  private connectionPromise: Promise<void> | null = null;

  private readonly authService = inject(AuthService)

  /**
   * Inicia la conexion global con el Hub de SignalR.
   * Utiliza el 'accessTokenFactory' para autenticarse automaticamente
   * con el token JWT del AuthService.
   */
  public startConnection(): Promise<void> {
    // Si ya esta conectado o conectando, devolver la promesa existente
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Construir la conexion
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.apiURL + 'appHub', { // Coindicencia con tu MapHub del backend

        // 2Autenticacion !Important
        // La factory se ejecutara cada vez que SignalR necesite un token.
        accessTokenFactory: () => this.authService.getAccessToken()
      })
      .withAutomaticReconnect() // Manejo de reconexiones automaticas
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Iniciar la conexion
    this.connectionPromise = this.hubConnection.start()
      .then(() => {
        console.log('[SignalR] Conexión establecida y autenticada.');
      })
      .catch(err => {
        console.error('[SignalR] Error al iniciar conexión:', err);
        this.connectionPromise = null; // Permitir reintentos si falla
        throw err;
      });

    return this.connectionPromise;
  }

  /**
   * Detiene la conexion de SignalR.
   */
  public stopConnection(): void {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.stop()
        .then(() => {
          console.log('[SignalR] Conexion detenida.');
          this.connectionPromise = null;
        })
        .catch(err => console.error('Error al detener SignalR:', err));
    }
  }

  /**
   * Escucha en un "topic" (metodo) específico del Hub.
   * Devuelve un Observable que emite los datos recibidos.
   * @param topic El nombre del método en el Hub (ej: "ReceiveItemUpdate")
   */
  public listenToTopic<T>(topic: string): Observable<T> {
    // Usar un Subject para "traducir" el callback del hub a un Observable
    const subject = new Subject<T>();

    // Esperar a que la conexión este lista antes de suscribirnos
    this.ensureConnection().then(() => {
      this.hubConnection.on(topic, (data: T) => {
        // Cuando el hub nos envia datos, se emiten en el Subject
        subject.next(data);
      });
    });

    return subject.asObservable();
  }

  /**
   * Un helper privado para asegurar que la conexion este activa
   * antes de intentar registrar un listener.
   */
  private ensureConnection(): Promise<void> {
    if (!this.connectionPromise) {
      console.warn('Se intentó escuchar un topic sin una conexión iniciada. Iniciando ahora.');
      return this.startConnection();
    }
    return this.connectionPromise;
  }

  /**
   * Envia un mensaje al Hub (Cliente -> Servidor).
   * (Gunción crucial para la Fase 2: Inventario Grupal)
   */
  public invokeHubMethod<T>(methodName: string, ...args: any[]): Promise<T> {
    return this.ensureConnection().then(() => {
      return this.hubConnection.invoke(methodName, ...args);
    });
  }
}
