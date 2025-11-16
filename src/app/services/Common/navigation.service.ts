import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService } from '../auth.service';
import { ZonasInventarioService } from '../zonas-inventario.service';


/**
 * Servicio centralizado para navegación
 * Maneja rutas y estados de navegación con validaciones
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly zonasService = inject(ZonasInventarioService);
  private readonly alertController = inject(AlertController);

  /**
   * Navega al scanner en modo normal
   */
  navigateToScanner(zoneId: number, isGuest: boolean = false): void {
    this.router.navigate(['/scanner', zoneId], {
      state: { isGuest }
    });
  }

  /**
   * Navega al scanner en modo descripción
   * Valida usuario y zonas antes de navegar
   */
  async navigateToScannerDescription(): Promise<void> {
    try {
      const user = await this.authService.getUserFromToken();
      const userId = user?.userId ?? 0;

      if (!userId) {
        await this.showAlert('Error', 'No se pudo identificar el usuario actual.');
        return;
      }

      const zonas = await this.zonasService.getZonas(userId).toPromise();

      if (!zonas?.length) {
        await this.showAlert('Sin zonas', 'No se encontraron zonas asociadas a tu usuario.');
        return;
      }

      // Tomar el branchId de la primera zona
      const branchId = zonas[0].branchId;

      this.router.navigate(['/scanner', branchId], {
        state: {
          scanMode: 'description',
          isGuest: false
        }
      });
    } catch (error) {
      console.error('Error al iniciar escaneo de descripción:', error);
      await this.showAlert('Error', 'No se pudo preparar el escáner para descripción.');
    }
  }

  /**
   * Navega a los detalles de una categoría
   */
  navigateToItem(categoryId: number, zoneId: string | null, categoria: any): void {
    this.router.navigate(['/inicio-mouse', categoryId, zoneId], {
      state: { categoria }
    });
  }

  /**
   * Navega al login
   */
  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Navega a inicio operativo con confirmación
   */
  async navigateToOperativo(zoneId: number, zoneName: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar Zona',
      message: `Ingreso a la zona ${zoneName}`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Ingresar',
          cssClass: 'primary',
          handler: () => {
            this.router.navigate(['/inicio-operativo', zoneId]);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Helper para mostrar alertas simples
   */
  private async showAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
