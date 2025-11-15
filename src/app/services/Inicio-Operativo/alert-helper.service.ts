import { Injectable, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';

/**
 * Helper para simplificar la creación de alertas
 */
@Injectable({
  providedIn: 'root'
})
export class AlertHelperService {
  private readonly alertController = inject(AlertController);

  /**
   * Muestra alerta simple con mensaje
   */
  async showInfo(header: string, message: string): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Muestra alerta de éxito
   */
  async showSuccess(message: string): Promise<void> {
    const alert = await this.alertController.create({
      header: '✅ Éxito',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Muestra alerta de error
   */
  async showError(message: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Error',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Muestra alerta de confirmación con callback
   */
  async showConfirmation(
    header: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    confirmText: string = 'Confirmar',
    cancelText: string = 'Cancelar'
  ): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: [
        {
          text: cancelText,
          role: 'cancel'
        },
        {
          text: confirmText,
          handler: async () => {
            await onConfirm();
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Muestra alerta con callback al cerrar
   */
  async showInfoWithCallback(header: string, message: string, onDismiss: () => void): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
    alert.onDidDismiss().then(() => onDismiss());
  }
}
