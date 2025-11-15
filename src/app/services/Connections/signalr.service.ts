import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { environment } from 'src/environments/environment.prod';
import { AuthService } from '../auth.service';
import { InventoryService } from '../inventary.service';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {

  private hubConnection: HubConnection | null = null;
  private hubUrl = environment.apiURL + 'appHub';

  constructor(
    private authService: AuthService,
    private alertController: AlertController,
    private inventoryService: InventoryService
  ) { }

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
      await this.hubConnection.start();
      console.log('Conexión SignalR establecida con éxito. ID:', this.hubConnection.connectionId);

      this.registerInventoryListeners();

    } catch (err) {
      console.error('Error al conectar con SignalR:', err);
      setTimeout(() => this.startConnection(), 5000);
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
      console.error('No se puede unir al grupo, SignalR no está conectado.');
      await this.startConnection();
      return Promise.reject('SignalR no está conectado.');
    }

    try {
      await this.hubConnection.invoke('JoinInventoryGroup', inventaryId.toString());
    } catch (err) {
      console.error(`[SignalR] Error al unirse al grupo Inventary-${inventaryId}:`, err);
      return Promise.reject(err);
    }
  }
}
