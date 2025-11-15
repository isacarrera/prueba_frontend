import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  appsOutline,
  arrowBackOutline,
  chevronDownCircleOutline,
  closeCircleOutline,
  lockClosedOutline,
  lockOpenOutline,
  personAddOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';
import { FilterState, StateZone, ZonaInventarioBranch } from 'src/app/Interfaces/zone.model';
import { AuthService } from 'src/app/services/auth.service';
import { InventoryService } from 'src/app/services/inventary.service';
import { ZonasInventarioService } from 'src/app/services/zonas-inventario.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class HomePage {

  searchTerm: string = '';
  zonas: ZonaInventarioBranch[] = [];
  cargando = true;

  filters: FilterState[] = [
    { id: 1, name: 'Todos', state: null, icon: 'apps-outline', active: true },
    { id: 2, name: 'Disponible', state: StateZone.Available, icon: 'lock-open-outline', active: false },
    { id: 3, name: 'En Inventario', state: StateZone.InInventory, icon: 'lock-close-outline', active: false },
    { id: 4, name: 'En Verificación', state: StateZone.InVerification, icon: 'shield-checkmark-outline', active: false }
  ];

  activeFilter: StateZone | null = null;

  constructor(
    private router: Router,
    private zonasService: ZonasInventarioService,
    private authService: AuthService,
    private alertController: AlertController,
    private inventoryService: InventoryService,
  ) {
    addIcons({
      arrowBackOutline,
      chevronDownCircleOutline,
      'close-circle-outline': closeCircleOutline,
      'lock-open-outline': lockOpenOutline,
      'lock-close-outline': lockClosedOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      'apps-outline': appsOutline,
      'person-add-outline': personAddOutline
    });
  }

  async ionViewWillEnter() {
    await this.cargarZonas();
  }

  async handleRefresh(event: any) {
    await this.cargarZonas();
    event.target.complete();
  }

  goBack() {
    this.router.navigate(['/login']);
  }

  async goToOperativo(zonaId: number, zonaName: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar Zona',
      message: `¿Estás seguro que deseas ingresar a la zona <strong>${zonaName}</strong>?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Confirmar',
          cssClass: 'primary',
          handler: () => {
            this.router.navigate(['/inicio-operativo', zonaId]);
          }
        }
      ]
    });

    await alert.present();
  }

  setFilter(filter: FilterState) {
    this.filters.forEach(f => f.active = false);
    filter.active = true;
    this.activeFilter = filter.state;
  }

  filteredZonas() {
    let filtered = this.zonas;

    if (this.searchTerm) {
      filtered = filtered.filter(z =>
        z.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    if (this.activeFilter !== null) {
      filtered = filtered.filter(z => z.stateZone === this.activeFilter);
    }

    return filtered;
  }

  clearFilters() {
    this.searchTerm = '';
    this.setFilter(this.filters[0]);
  }

  async cargarZonas() {
    this.cargando = true;

    try {
      const user = await this.authService.getUserFromToken();
      if (user?.userId) {
        this.zonasService.getZonas(user.userId).subscribe({
          next: (data: ZonaInventarioBranch[]) => {
            this.zonas = data;
            this.cargando = false;

            if (this.zonas.length === 0) {
              this.mostrarAlerta('Aviso', 'No tienes inventarios asignados en este momento.');
            }
          },
          error: async (err) => {
            console.error('Error al cargar zonas', err);
            this.cargando = false;

            if (err.status === 404) {
              this.mostrarAlerta('Aviso', 'No tienes inventarios asignados en este momento.');
            } else {
              this.mostrarAlerta('Error', 'Ocurrió un problema al cargar las zonas.');
            }
          }
        });
      } else {
        this.cargando = false;
        console.error('Usuario no autenticado');
        this.mostrarAlerta('Error', 'Usuario no autenticado.');
      }
    } catch (error) {
      this.cargando = false;
      console.error('Error al obtener usuario:', error);
      this.mostrarAlerta('Error', 'Error al cargar las zonas.');
    }
  }

  private async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async scanItemDescription() {
    try {
      const user = await this.authService.getUserFromToken();
      const userId = user?.userId ?? 0;

      if (!userId) {
        const alert = await this.alertController.create({
          header: 'Error',
          message: 'No se pudo identificar el usuario actual.',
          buttons: ['OK'],
        });
        await alert.present();
        return;
      }

      const zonas = await this.zonasService.getZonas(userId).toPromise();
      if (!zonas?.length) {
        const alert = await this.alertController.create({
          header: 'Sin zonas',
          message: 'No se encontraron zonas asociadas a tu usuario.',
          buttons: ['OK'],
        });
        await alert.present();
        return;
      }

      const branchId = zonas[0].branchId;

      this.router.navigate(['/scanner', branchId], {
        state: {
          scanMode: 'description',
          isGuest: true
        },
      });
    } catch (error) {
      console.error('Error al iniciar escaneo de descripción:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'No se pudo preparar el escáner para descripción.',
        buttons: ['OK'],
      });
      await alert.present();
    }
  }

  /**
   * Muestra un prompt para que el invitado ingrese el código de inventario.
   */
  async presentJoinPrompt() {
    const alert = await this.alertController.create({
      header: 'Unirse a Inventario',
      message: 'Ingresa el código de inventario proporcionado por el anfitrión.',
      inputs: [
        {
          name: 'inventaryId',
          type: 'number',
          placeholder: 'Código (ej: 101)',
          min: 1,
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Unirse',
          handler: (data) => {
            if (!data.inventaryId || Number(data.inventaryId) <= 0) {
              this.mostrarAlerta('Error', 'Debes ingresar un código válido.');
              return false;
            }
            return data;
          },
        },
      ],
    });

    alert.onDidDismiss().then(async (result) => {
      if (result.role !== 'cancel' && result.data && result.data.inventaryId) {

        const inventaryId = Number(result.data.inventaryId);
        await this.handleJoinInventory(inventaryId);

      }
    });

    await alert.present();
  }

  /**
   * Maneja la lógica de validación y navegación del invitado.
   */
  private async handleJoinInventory(inventaryId: number): Promise<boolean> {
    try {
      const zoneId = await this.inventoryService.joinInventory(inventaryId);

      this.router.navigate(['/scanner', zoneId], {
        state: { isGuest: true }
      });
      return true;

    } catch (err: any) {

      console.error('[handleJoinInventory] ¡ERROR! La llamada al servicio falló:', err);

      const alert = await this.alertController.create({
        header: 'Error al unirse',
        message: err?.message || 'Error desconocido.',
        buttons: ['OK']
      });
      await alert.present();

      return false;
    }
  }
}
