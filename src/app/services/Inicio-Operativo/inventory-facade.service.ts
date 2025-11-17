import { inject, Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { FinishRequestDto } from 'src/app/Interfaces/finish-request.model';
import { ManualScanEntry } from 'src/app/Interfaces/missing.model copy';
import { StartInventoryRequestDto } from 'src/app/Interfaces/start-inventory-request.model';
import { UnscannedItemsModalComponent } from 'src/app/components/unscanned-items-modal/unscanned-items-modal.component';
import { AuthService } from '../auth.service';
import { InventoryService } from '../inventary.service';
import { OperatingService } from '../operating.service';


/**
 * Facade que orquesta toda la lógica compleja de inventario
 * Separa responsabilidades del componente y centraliza validaciones
 */
@Injectable({
  providedIn: 'root'
})
export class InventoryFacadeService {
  private readonly inventoryService = inject(InventoryService);
  private readonly operatingService = inject(OperatingService);
  private readonly authService = inject(AuthService);
  private readonly alertController = inject(AlertController);
  private readonly modalController = inject(ModalController);

  /**
   * Obtiene el Operating Group ID del usuario actual
   */
  async getOperatingGroupId(): Promise<number | null> {
    try {
      const user = await this.authService.getUserFromToken();
      const userId = user?.userId ?? 0;

      if (!userId) {
        console.warn('No se pudo obtener userId del token');
        return null;
      }

      const data = await firstValueFrom(this.operatingService.GetOperatingId(userId));
      console.log('Operating obtenido:', data);
      return data.operatingGroupId;
    } catch (err) {
      console.error('Error obteniendo operating ❌', err);
      return null;
    }
  }

  /**
   * Valida si el inventario está completo comparando escaneados vs esperados
   * @returns true si está completo, false si faltan items
   */
  validateInventoryCompletion(categorias: any[]): {
    isComplete: boolean;
    totalEsperado: number;
    totalEscaneado: number;
    itemsFaltantes: number;
  } {
    const totalEsperado = categorias.reduce((sum, cat) => sum + (cat.contador || 0), 0);
    const totalEscaneado = this.inventoryService.getScannedItems().length;
    const itemsFaltantes = totalEsperado - totalEscaneado;

    return {
      isComplete: totalEscaneado >= totalEsperado,
      totalEsperado,
      totalEscaneado,
      itemsFaltantes
    };
  }

  /**
   * Muestra alerta de confirmación cuando faltan items
   */
  async showIncompleteInventoryAlert(validation: ReturnType<typeof this.validateInventoryCompletion>): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: '⚠️ ¡Atención!',
        message: `Has escaneado ${validation.totalEscaneado} de ${validation.totalEsperado} ítems.\n\nFaltan ${validation.itemsFaltantes} ítems. ¿Estás seguro de que quieres finalizar?`,
        cssClass: 'custom-alert',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            cssClass: 'alert-button-cancel',
            handler: () => resolve(false)
          },
          {
            text: 'Finalizar de todos modos',
            cssClass: 'alert-button-danger',
            handler: () => resolve(true)
          }
        ]
      });
      await alert.present();
    });
  }

  /**
   * Inicia un nuevo inventario
   */
  async startInventory(zoneId: number, operatingGroupId: number): Promise<{ success: boolean; inventaryId?: number; invitationCode?: string; error?: string }> {
    const request: StartInventoryRequestDto = {
      zoneId,
      operatingGroupId
    };

    try {
      const res = await firstValueFrom(this.inventoryService.start(request));

      if (!res || !res.inventaryId || !res.invitationCode) {
        throw new Error('El backend no devolvió ID o Código de Invitación.');
      }

      this.inventoryService.setInventaryId(res.inventaryId);

      return {
        success: true,
        inventaryId: res.inventaryId,
        invitationCode: res.invitationCode
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'No se pudo iniciar el inventario.'
      };
    }
  }

  /**
   * Finaliza el inventario actual
   */
  async finishInventory(observations: string): Promise<{ success: boolean; error?: string }> {
    const inventaryId = this.inventoryService.getInventaryId();

    if (!inventaryId) {
      return { success: false, error: 'No hay un inventario activo.' };
    }

    try {
      // Consultar Faltantes al Backend
      const missingItems = await firstValueFrom(
        this.inventoryService.getMissingItems(inventaryId)
      );

      // PASO 2: Si hay faltantes, abrir Modal
      if (missingItems && missingItems.length > 0) {

        // MapeaR el DTO del back al formato que espera el Modal
        const modalItems = missingItems.map(item => ({
          id: item.itemId,
          code: item.code,
          name: item.name,
          description: item.description,
          currentState: item.currentState
        }));

        const modal = await this.modalController.create({
          component: UnscannedItemsModalComponent,
          componentProps: {
            unscannedItems: modalItems
          },
          backdropDismiss: false // Obliga a interactuar
        });

        await modal.present();
        const { data } = await modal.onWillDismiss();

        // Si el usuario cancela el modal, abortar la finalización
        if (!data || data.action !== 'apply') {
          return { success: false, error: 'Finalización cancelada: Ítems pendientes.' };
        }

        // PASO 3: Registrar Correcciones
        // El modal devuelve texto ('en orden'), el back necesita IDs (1)
        const itemsToSend: ManualScanEntry[] = data.updatedItems.map((uItem: any) => ({
          itemId: uItem.id,
          stateItemId: this.mapStateToId(uItem.finalState)
        }));

        await firstValueFrom(
          this.inventoryService.registerManualScans(inventaryId, itemsToSend)
        );
      }

      const request: FinishRequestDto = {
        inventaryId,
        observations: observations.trim() || ''
      };

      await this.inventoryService.finish(request).toPromise();
      this.inventoryService.setInventaryId(0);

      return { success: true };

    } catch (error: any) {
      console.error('Error en proceso de finalización:', error);
      const msg = error?.error?.Message || error?.message || 'Error desconocido.';
      return { success: false, error: msg };
    }
  }

  /**
   * Helper para convertir el texto del Modal a IDs de base de datos
   */
  private mapStateToId(stateText: string): number {
    const normalized = stateText?.toLowerCase().trim() || '';
    switch (normalized) {
      case 'en orden': return 1;
      case 'reparación': return 2;
      case 'dañado': return 3;
      case 'perdido': return 4;
      default: return 4; // Default a Perdido si falla
    }
  }

  /**
   * Obtiene el total de items escaneados actualmente
   */
  getScannedItemCount(): number {
    // Reutilizamos el 'inventoryService' que ya está inyectado
    return this.inventoryService.getScannedItems().length;
  }

  /**
   * Verifica si hay un inventario activo
   */
  hasActiveInventory(): boolean {
    return !!this.inventoryService.getInventaryId();
  }
}
