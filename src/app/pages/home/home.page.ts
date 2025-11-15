import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, IonicModule, LoadingController } from '@ionic/angular';
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
    private loadingController: LoadingController
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

  // Se ejecuta cada vez que la vista entra en pantalla
  async ionViewWillEnter() {
    await this.cargarZonas();
  }

  //  MÉTODO NUEVO PARA PULL-TO-REFRESH
  async handleRefresh(event: any) {
    console.log('Iniciando recarga...');
    await this.cargarZonas();
    // Completar el refresh
    event.target.complete();
    console.log('Recarga completada');
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
          handler: () => {
            console.log('Operación cancelada');
          }
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
    // Desactivar todos los filtros
    this.filters.forEach(f => f.active = false);

    // Activar el filtro seleccionado
    filter.active = true;
    this.activeFilter = filter.state;
  }

  filteredZonas() {
    let filtered = this.zonas;

    // Filtro por texto de búsqueda
    if (this.searchTerm) {
      filtered = filtered.filter(z =>
        z.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (this.activeFilter !== null) {
      filtered = filtered.filter(z => z.stateZone === this.activeFilter);
    }

    return filtered;
  }

  clearFilters() {
    this.searchTerm = '';
    this.setFilter(this.filters[0]); // Volver a "Todos"
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

      // 🔹 Obtener zonas del usuario (cada una tiene su branchId)
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

      // 🔹 Tomar el branchId de la primera zona (ajusta si necesitas elegir)
      const branchId = zonas[0].branchId;

      // 🔹 Navegar al escáner en modo descripción
      this.router.navigate(['/scanner', branchId], {
        state: { scanMode: 'description' },
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
          handler: () => {
            console.log('Prompt: Cancelado');
          }
        },
        {
          text: 'Unirse',
          handler: (data) => {
            // Validamos la entrada
            if (!data.inventaryId || Number(data.inventaryId) <= 0) {
              this.mostrarAlerta('Error', 'Debes ingresar un código válido.');
              console.log('Prompt: Handler falló (código inválido)');
              return false; // Evita que la alerta se cierre
            }
            // Si es válido, el handler retorna los datos
            console.log('Prompt: Handler exitoso. Datos:', data);
            return data;
          },
        },
      ],
    });

    // Escuchamos el evento onDidDismiss (CUANDO la alerta se cierra)
    alert.onDidDismiss().then(async (result) => {

      // --- [INICIO DE LA DEPURACIÓN] ---
      console.log('onDidDismiss: Evento disparado.');
      console.log('onDidDismiss: Result Role:', result.role);
      console.log('onDidDismiss: Result Data:', JSON.stringify(result.data));
      // --- [FIN DE LA DEPURACIÓN] ---

      // ESTA ES LA LÍNEA CORREGIDA:
      if (result.role !== 'cancel' && result.data && result.data.inventaryId) {

        console.log('onDidDismiss: ¡Validación exitosa! Llamando a handleJoinInventory...');
        const inventaryId = Number(result.data.inventaryId);

        // Llamamos a la lógica pesada (con el 'loading')
        await this.handleJoinInventory(inventaryId);

      } else {
        console.log('onDidDismiss: Validación fallida. No se hace nada.');
      }
    });

    await alert.present();
  }

  // La función handleJoinInventory (la que tiene el 'loading' y el try/catch)
  // que te pasé en el mensaje anterior estaba perfecta. No la cambies.
  private async handleJoinInventory(inventaryId: number): Promise<boolean> {

    // NO MÁS 'loadingController' POR AHORA.

    try {
      // 1. ESTE ES EL LOG QUE NECESITAMOS VER
      console.log(`[handleJoinInventory] INTENTANDO: Llamar a inventoryService.joinInventory(${inventaryId})...`);

      const zoneId = await this.inventoryService.joinInventory(inventaryId);

      // 2. SI VES ESTO, ¡GANAMOS!
      console.log(`[handleJoinInventory] ÉXITO: Recibido zoneId ${zoneId}. Navegando...`);

      this.router.navigate(['/scanner', zoneId]);
      return true;

    } catch (err: any) {

      // 3. SI VES ESTO, EL PROBLEMA ESTÁ EN EL SERVICIO O LA API
      console.error('[handleJoinInventory] ¡ERROR! La llamada al servicio falló:', err);

      // Mostramos un alert simple, que no debería fallar
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
