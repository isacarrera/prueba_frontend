import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { environment } from 'src/environments/environment.prod'; // Tu archivo con la IP local
import { AlertController } from '@ionic/angular';
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

  /**
   * Inicia la conexión con el Hub.
   * Se debe llamar DESPUÉS de tener el token (Login exitoso).
   */
  public async startConnection(): Promise<void> {
    // Evitar múltiples conexiones
    if (this.hubConnection && this.hubConnection.state === 'Connected') {
      console.log('⚠️ SignalR ya está conectado.');
      return;
    }

    // Construir la conexión
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        // Factoría de token: SignalR llamará a esto automáticamente si necesita reconectar
        accessTokenFactory: async () => {
          const token = await this.authService.getAccessToken();
          return token || '';
        }
      })
      .withAutomaticReconnect() // Intenta reconectar si cae la red
      .configureLogging(LogLevel.Information)
      .build();

    // 1. Arrancar la conexión
    try {
      await this.hubConnection.start();
      console.log('✅ Conexión SignalR establecida con éxito. ID:', this.hubConnection.connectionId);

      this.registerTestListener();
      this.registerInventoryListeners();

    } catch (err) {
      console.error('❌ Error al conectar con SignalR:', err);
      // Opcional: Reintentar conexión después de unos segundos
      setTimeout(() => this.startConnection(), 5000);
    }
  }

  /**
   * Escucha el evento de prueba disparado desde Swagger
   */
  private registerTestListener() {
    if (!this.hubConnection) return;

    // "ReceiveTestAlert" debe coincidir con el string en el Controller .NET
    this.hubConnection.on('ReceiveTestAlert', async (mensaje: string) => {
      console.log('🔔 Evento SignalR Recibido:', mensaje);
      await this.mostrarAlertaPrueba(mensaje);
    });
  }

  /**
   * Muestra la alerta visual en el dispositivo
   */
  private async mostrarAlertaPrueba(mensaje: string) {
    const alert = await this.alertController.create({
      header: '🔔 Test SignalR',
      subHeader: 'Mensaje desde el Servidor',
      message: mensaje,
      buttons: ['Entendido'],
      cssClass: 'custom-alert' // Puedes personalizarlo en global.scss
    });
    await alert.present();
  }

  /**
   * Cierra la conexión (útil al hacer Logout)
   */
  public async stopConnection() {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
      console.log('🛑 Conexión SignalR detenida.');
    }
  }

  private registerInventoryListeners() {
    if (!this.hubConnection) return;

    // "ReceiveItemUpdate" -> Coincide con tu servicio .NET
    this.hubConnection.on('ReceiveItemUpdate', (payload: { itemId: number, stateItemId: number, inventaryId: number }) => {

      console.log('🔔 Evento [ReceiveItemUpdate] Recibido:', payload);

      if (payload && typeof payload.itemId === 'number') {
        // Le pasamos el ID a nuestro servicio de estado
        this.inventoryService.addScannedItem(payload.itemId);
      } else {
        console.error('Payload de ReceiveItemUpdate inválido:', payload);
      }
    });
  }
}
