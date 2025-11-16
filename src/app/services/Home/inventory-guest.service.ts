import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

import { ZoneFacadeService } from './zone-facade.service';
import { InventoryService } from '../inventary.service';
import { AuthService } from '../auth.service';

/**
 * Servicio especializado para gestión de invitados a inventarios
 * Maneja códigos de invitación y navegación de invitados
 */
@Injectable({
  providedIn: 'root'
})
export class InventoryGuestService {
  private readonly inventoryService = inject(InventoryService);
  private readonly authService = inject(AuthService);
  private readonly zoneFacade = inject(ZoneFacadeService);
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);

  /**
   * Muestra prompt para que el invitado ingrese código
   */
  async showJoinPrompt(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Unirse a Inventario',
      message: 'Ingresa el código de invitación (ej: D8K4) proporcionado por el anfitrión.',
      inputs: [
        {
          name: 'invitationCode',
          type: 'text',
          placeholder: 'Código (ej: D8K4)',
          attributes: {
            autocapitalize: 'off',
            autocorrect: 'off'
          }
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Unirse',
          handler: async (data) => {
            const code = data.invitationCode?.trim().toUpperCase();

            if (!code) {
              await this.showError('Debes ingresar un código.');
              return false; // Mantiene la alerta abierta
            }

            return await this.joinInventory(code);
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Procesa la unión de un invitado al inventario
   */
  private async joinInventory(invitationCode: string): Promise<boolean> {
    try {
      const { zoneId } = await this.inventoryService.joinInventory(invitationCode);

      // Navegar como invitado
      this.router.navigate(['/scanner', zoneId], {
        state: { isGuest: true }
      });

      return true; // Cierra la alerta
    } catch (err: any) {
      console.error('[joinInventory] Error al unirse:', err);
      await this.showError(err?.message || 'Error desconocido al unirse.');
      return false; // Mantiene la alerta abierta
    }
  }

  /**
   * Navega al scanner en modo descripción para invitado
   */
  async navigateToDescriptionScanner(): Promise<void> {
    try {
      const user = await this.authService.getUserFromToken();
      const userId = user?.userId ?? 0;

      if (!userId) {
        await this.showError('No se pudo identificar el usuario actual.');
        return;
      }

      const branchId = await this.zoneFacade.getFirstBranchId();

      if (!branchId) {
        await this.showError('No se encontraron zonas asociadas a tu usuario.');
        return;
      }

      this.router.navigate(['/scanner', branchId], {
        state: {
          scanMode: 'description',
          isGuest: true
        }
      });
    } catch (error) {
      console.error('Error al iniciar escaneo de descripción:', error);
      await this.showError('No se pudo preparar el escáner para descripción.');
    }
  }

  /**
   * Helper para mostrar errores
   */
  private async showError(message: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Error',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
