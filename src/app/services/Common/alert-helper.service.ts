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

  /**
   * Muestra alerta de confirmación para salir de la aplicación
   * @returns Promise<boolean> - true si confirma salir, false si cancela
   */
  async showExitConfirmation(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: 'Salir',
        message: '¿Estás seguro de que deseas salir de la aplicación?',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: 'Salir',
            handler: () => resolve(true)
          }
        ]
      });
      await alert.present();
    });
  }

  // En: AlertHelperService.ts

  /**
   * Muestra alerta de confirmación con un input de textarea
   * @returns Promise<string | null> - El texto escrito, o null si cancela
   */
  async showObservationPrompt(
    header: string,
    message: string
  ): Promise<string | null> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header,
        message,
        cssClass: 'custom-alert', // Opcional, si tienes estilos
        inputs: [
          {
            name: 'observations',
            type: 'textarea',
            placeholder: 'Observaciones (opcional)'
          }
        ],
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            cssClass: 'alert-button-cancel',
            handler: () => resolve(null) // Resuelve null si cancela
          },
          {
            text: 'Finalizar',
            cssClass: 'alert-button-confirm', // Opcional
            handler: (data) => {
              const obs = (data?.observations ?? '').trim();
              resolve(obs); // Resuelve el texto (vacío o escrito)
            }
          }
        ]
      });
      await alert.present();
    });
  }
}
