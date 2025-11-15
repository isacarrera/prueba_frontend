import { Injectable, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { firstValueFrom, Observable } from 'rxjs';
import { InventoryService } from '../inventary.service';
import { OperatingService } from '../operating.service';
import { AuthService } from '../auth.service';
import { StartInventoryRequestDto } from 'src/app/Interfaces/start-inventory-request.model';
import { FinishRequestDto } from 'src/app/Interfaces/finish-request.model';


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
      return {
        success: false,
        error: 'No hay un inventario activo para finalizar.'
      };
    }

    const request: FinishRequestDto = {
      inventaryId,
      observations: observations.trim() || ''
    };

    try {
      await this.inventoryService.finish(request).toPromise();
      this.inventoryService.setInventaryId(0);

      return { success: true };
    } catch (error: any) {
      console.error('Error al finalizar inventario:', error);

      let errorMessage = 'No se pudo finalizar el inventario.';
      if (error?.error?.message) errorMessage = error.error.message;
      else if (error?.status === 400) errorMessage = 'Datos inválidos. Verifica la información.';
      else if (error?.status === 404) errorMessage = 'Inventario no encontrado.';

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Verifica si hay un inventario activo
   */
  hasActiveInventory(): boolean {
    return !!this.inventoryService.getInventaryId();
  }
}
