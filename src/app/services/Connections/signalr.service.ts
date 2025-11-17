import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { environment } from 'src/environments/environment.prod';
import { AuthService } from '../auth.service';
import { InventoryService } from '../inventary.service';
import { ZoneFacadeService } from '../Home/zone-facade.service';
import { ZoneStateUpdate } from 'src/app/Interfaces/zone.model';
import { VerificationListUpdate } from 'src/app/Interfaces/verification.model';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {

  private hubConnection: HubConnection | null = null;
  private hubUrl = environment.apiURL + 'appHub';

  constructor(
    private authService: AuthService,
    private alertController: AlertController,
    private inventoryService: InventoryService,
    private zoneFacade: ZoneFacadeService
  ) { }

  private verificationListUpdateSubject = new Subject<VerificationListUpdate>();
  public verificationListUpdates$ = this.verificationListUpdateSubject.asObservable();

  public async startConnection(): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === 'Connected') {
      console.log('SignalR ya está conectado.');
      return;
    }

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        accessTokenFactory: async () => {
          const token = await this.authService.getAccessToken();
          return token || '';
        }
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    try {
      console.log('[SignalR] Iniciando conexión...');
      await this.hubConnection.start();
      console.log('Conexión SignalR establecida con éxito. ID:', this.hubConnection.connectionId);
      this.registerInventoryListeners();
      this.registerZoneStateListener();
      this.registerVerificationListListener();

    } catch (err) {
      console.error('Error al conectar con SignalR:', err);
      throw err
    }
  }

  public async stopConnection() {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
      console.log('Conexión SignalR detenida.');
    }
  }

  private registerInventoryListeners() {
    if (!this.hubConnection) return;

    this.hubConnection.on('ReceiveItemUpdate', (payload: { itemId: number, stateItemId: number, inventaryId: number }) => {
      if (payload && typeof payload.itemId === 'number') {
        this.inventoryService.addScannedItem(payload.itemId);
      } else {
        console.error('Payload de ReceiveItemUpdate inválido:', payload);
      }
    });
  }

  public async joinInventoryGroup(inventaryId: number | string): Promise<void> {
    if (this.hubConnection?.state !== 'Connected') {
      console.warn(`[SignalR] Conexión no activa ('${this.hubConnection?.state}'). Forzando (re)conexión...`);
      try {
        await this.startConnection();
        console.log('[SignalR] Reconexión exitosa.');
      } catch (err) {
        console.error('[SignalR] Falla en la reconexión.', err);
        throw new Error('No se pudo establecer la conexión de SignalR.');
      }
    }

    if (!this.hubConnection) {
      throw new Error('Conexión SignalR no disponible después del intento de reconexión.');
    }

    try {
      await this.hubConnection.invoke('JoinInventoryGroup', inventaryId.toString());
      console.log(`[SignalR] Unido exitosamente al grupo: Inventary-${inventaryId}`);
    } catch (err) {
      console.error(`[SignalR] Error al invocar 'JoinInventoryGroup':`, err);
      throw err;
    }
  }

  /**
   * Escucha cambios de estado de Zonas y los pasa al ZoneFacade.
   */
  private registerZoneStateListener(): void {
    if (!this.hubConnection) return;

    // "ReceiveZoneStateUpdate" debe coincidir con el string en el backend
    this.hubConnection.on('ReceiveZoneStateUpdate', (payload: ZoneStateUpdate) => {
      console.log('Evento [ReceiveZoneStateUpdate] Recibido:', payload);
      this.zoneFacade.handleZoneStateUpdate(payload);
    });
  }

  /**
   * Escucha cambios en la lista de verificación (Añadir/Quitar).
   */
  private registerVerificationListListener(): void {
    if (!this.hubConnection) return;

    // "ReceiveVerificationListUpdate" debe coincidir con el backend
    this.hubConnection.on('ReceiveVerificationListUpdate', (payload: VerificationListUpdate) => {
      console.log('Evento [ReceiveVerificationListUpdate] Recibido:', payload);
      this.verificationListUpdateSubject.next(payload);
    });
  }
}
