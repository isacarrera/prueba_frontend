import { Injectable, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { InventoryService } from '../inventary.service';
import { InvenService } from '../inven.service';
import { AlertHelperService } from '../Common/alert-helper.service';


/**
 * Servicio especializado para manejar salida de Inicio-Operativo
 * Gestiona dos escenarios: con y sin inventario activo
 */
@Injectable({
  providedIn: 'root'
})
export class InventoryExitService {
  private readonly inventoryService = inject(InventoryService);
  private readonly invenService = inject(InvenService);
  private readonly alertHelper = inject(AlertHelperService);
  private readonly alertController = inject(AlertController);

  /**
   * Determina qué tipo de confirmación mostrar según estado del inventario
   * @returns true si debe proceder con la navegación
   */
  async handleExitAttempt(): Promise<boolean> {
    const hasActiveInventory = this.hasActiveInventory();

    if (hasActiveInventory) {
      return await this.showInventoryActiveModal();
    } else {
      return await this.alertHelper.showExitConfirmation();
    }
  }

  /**
   * Verifica si hay un inventario activo
   */
  hasActiveInventory(): boolean {
    const inventoryId = this.inventoryService.getInventaryId();
    return inventoryId !== null && inventoryId !== 0;
  }

  /**
   * Muestra modal personalizado cuando hay inventario activo
   * @returns Promise<boolean> - true si confirma cancelar inventario
   */
  private async showInventoryActiveModal(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: '⚠️ Inventario en curso',
        message: 'Si sales ahora, se cancelará el inventario iniciado y se perderán todos los escaneos realizados. ¿Deseas continuar?',
        cssClass: 'inventory-exit-alert',
        buttons: [
          {
            text: 'Permanecer',
            role: 'cancel',
            cssClass: 'alert-button-cancel',
            handler: () => resolve(false)
          },
          {
            text: 'Salir y Cancelar',
            cssClass: 'alert-button-danger',
            handler: async () => {
              const cancelled = await this.cancelActiveInventory();
              resolve(cancelled);
            }
          }
        ]
      });
      await alert.present();
    });
  }

  /**
   * Cancela el inventario activo (limpia cache y elimina de DB)
   */
  private async cancelActiveInventory(): Promise<boolean> {
    const inventoryId = this.inventoryService.getInventaryId();

    if (!inventoryId) {
      console.warn('No hay inventario activo para cancelar');
      return false;
    }

    try {
      // Llamar al endpoint de cancelación
      await this.invenService.cancelInventory(inventoryId).toPromise();

      // Limpiar estado local
      this.inventoryService.setInventaryId(0);
      this.inventoryService.clearScannedItems();

      console.log('Inventario cancelado correctamente');
      return true;
    } catch (error: any) {
      console.error('Error al cancelar inventario:', error);

      await this.alertHelper.showError(
        error?.error?.message || 'No se pudo cancelar el inventario. Intenta nuevamente.'
      );

      return false;
    }
  }

  /**
   * Obtiene el ID del inventario activo (si existe)
   */
  getActiveInventoryId(): number | null {
    return this.inventoryService.getInventaryId();
  }
}
