import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule, IonTextarea, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  personCircleOutline,
  chatbubbleEllipsesOutline,
  documentTextOutline,
  homeOutline,
  qrCodeOutline,
  informationCircleOutline,
  ellipsisHorizontalCircleOutline,
  personAddOutline,
  arrowBackOutline,
  checkmarkOutline,
  readerOutline,
  logOutOutline,
  checkmarkDoneOutline,
  closeOutline,
} from 'ionicons/icons';

import { OperatingService } from 'src/app/services/operating.service';
import { AuthService } from 'src/app/services/auth.service';
import { ZonasInventarioService } from 'src/app/services/zonas-inventario.service';
import { StartInventoryRequestDto } from 'src/app/Interfaces/start-inventory-request.model';
import { FinishRequestDto } from 'src/app/Interfaces/finish-request.model';
import { InventoryStateService } from 'src/app/services/Connection/inventory-state-service.service';

@Component({
  selector: 'app-inicio-operativo',
  templateUrl: './inicio-operativo.page.html',
  styleUrls: ['./inicio-operativo.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class InicioOperativoPage implements OnInit {
  @ViewChild('observacionesTextarea') observacionesTextarea!: IonTextarea;

  // --- [SSOT PROPIEDADES] ---
  readonly categorias = this.inventoryStateService.categoriasConEstado;
  readonly cargando = this.inventoryStateService.isLoading;

  // Propiedades locales
  operatingGroupId: number | null = null;

  isInviteOpen = false;
  code = ['D', '8', 'K', '4'];

  isObservacionesOpen = false;
  observacionTexto: string = '';

  isExitOpen = false;
  isConfirmOpen = false;
  isExportOpen = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private inventoryStateService: InventoryStateService,
    private operatingService: OperatingService,
    private authService: AuthService,
    private alertController: AlertController,
    private zonasService: ZonasInventarioService,
  ) {
    addIcons({
      cloudUploadOutline,
      personCircleOutline,
      chatbubbleEllipsesOutline,
      documentTextOutline,
      homeOutline,
      qrCodeOutline,
      informationCircleOutline,
      ellipsisHorizontalCircleOutline,
      personAddOutline,
      arrowBackOutline,
      checkmarkOutline,
      readerOutline,
      logOutOutline,
      checkmarkDoneOutline,
      closeOutline,
    });
  }

  async ngOnInit() {
    const zonaId = Number(this.route.snapshot.paramMap.get('zonaId'));
    const user = await this.authService.getUserFromToken();
    const userId = user?.userId ?? 0;

    // Cargar categorias desde el SSOT
    // Solo carga las categorías desde la API si el estado está vacío
    // (es decir, si no hay un inventario activo).
    if (!this.inventoryStateService.currentInventaryId()) {
      console.log('[InicioOperativo] No hay inventario, cargando categorías...');
      await this.inventoryStateService.loadCategoriasPorZona(zonaId);
    } else {
      console.log('[InicioOperativo] Hay un inventario activo, el estado ya está cargado.');
    }

    // Obtener operatingGroupId (Sigue siendo logica de auth/session)
    if (userId) {
      this.operatingService.GetOperatingId(userId).subscribe({
        next: (data) => {
          this.operatingGroupId = data.operatingGroupId;
          // NOTA: Aqui seria un buen punto para unirse al grupo de SignalR
          // si ya tuvieramos la funcionalidad de grupos implementada
        },
        error: (err) => {
          console.error('Error obteniendo operating ❌', err);
        },
      });
    } else {
      console.warn('No se pudo obtener userId del token');
    }
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

      // Obtener zonas
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

      // Navegar al escaner en modo descripción
      this.router.navigate(['/scanner', branchId], {
        state: { scanMode: 'description' },
      });
    } catch (error) {
      console.error('Error al iniciar escaneo de descripcion:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'No se pudo preparar el escaner para descripcion.',
        buttons: ['OK'],
      });
      await alert.present();
    }
  }

  goToItem(categoria: any) {
    // La navegacion pasa la categoria, que ahora contiene los items con el estado 'completado'
    this.router.navigate(
      [
        '/items',
        categoria.id,
        this.route.snapshot.paramMap.get('zonaId'),
      ],
      {
        state: { categoria },
      }
    );
  }

  // === Modales (Sin cambios) ===
  openInviteModal() {
    this.isInviteOpen = true;
  }
  closeInviteModal() {
    this.isInviteOpen = false;
  }

  isInstructionsOpen = false;

  openInstructionsModal() {
    this.isInstructionsOpen = true;
  }

  closeInstructionsModal() {
    this.isInstructionsOpen = false;
  }
  openObservacionesModal() {
    this.isObservacionesOpen = true;
    setTimeout(() => {
      const textarea = document.querySelector('.sheet-textarea') as HTMLIonTextareaElement;
      textarea?.setFocus?.();
    }, 300);
  }

  closeObservacionesModal() {
    this.isObservacionesOpen = false;
  }

  openExitModal() {
    this.isExitOpen = true;
  }
  closeExitModal() {
    this.isExitOpen = false;
  }

  openConfirmModal() {
    this.isConfirmOpen = true;
  }
  closeConfirmModal() {
    this.isConfirmOpen = false;
  }

  openExportModal() {
    this.isExportOpen = true;
  }
  closeExportModal() {
    this.isExportOpen = false;
  }

  async guardarObservacion() {
    console.log('Observacion guardada:', this.observacionTexto || '(sin texto)');
    this.closeObservacionesModal();

    const alert = await this.alertController.create({
      header: '✅ Observacion guardada',
      message: this.observacionTexto.trim()
        ? 'Tu observacion ha sido guardada correctamente.'
        : 'No escribiste ninguna observacion, pero fue guardada como vacia.',
      buttons: ['OK'],
    });
    await alert.present();
  }

  // === Logica de Finalizar Inventario ===

  async finalizarInventario() {
    // Usa la data reactiva 'categorias()' para calcular el total
    const totalEsperado = this.categorias().reduce((sum, cat) => {
      return sum + (cat.contador || 0);
    }, 0);

    // Usa el SSOT para obtener la cuenta de escaneados
    const totalEscaneado = this.inventoryStateService.getScannedIds().size;

    if (totalEscaneado < totalEsperado) {
      const itemsFaltantes = totalEsperado - totalEscaneado;

      const alert = await this.alertController.create({
        header: '⚠️ ¡Atencion!',
        message: `Has escaneado ${totalEscaneado} de ${totalEsperado} items.\n\nFaltan ${itemsFaltantes} items. ¿Estas seguro de que quieres finalizar?`,
        cssClass: 'custom-alert',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            cssClass: 'alert-button-cancel',
            handler: () => {
              console.log('Finalizacion cancelada por el usuario.');
              this.closeConfirmModal();
            }
          },
          {
            text: 'Finalizar de todos modos',
            cssClass: 'alert-button-danger',
            handler: () => {
              console.log('Finalizando de todos modos...');
              this.procederConFinalizacion();
            }
          }
        ]
      });
      await alert.present();

    } else {
      console.log('Inventario completo. Finalizando...');
      this.procederConFinalizacion();
    }
  }

  async procederConFinalizacion() {
    // Usa el SSOT para obtener el ID del inventario activo
    const inventaryId = this.inventoryStateService.currentInventaryId();

    if (!inventaryId) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'No hay un inventario activo para finalizar.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const observations = this.observacionTexto?.trim() || '';
    const request: FinishRequestDto = {
      inventaryId: inventaryId,
      observations
    };

    try {
      // Llama al metodo del SSOT para finalizar
      await this.inventoryStateService.finishInventory(request);

      // El SSOT se encarga de llamar a inventaryService.finish() y resetInventoryState()
      this.observacionTexto = '';
      this.closeConfirmModal();

      const alert = await this.alertController.create({
        header: '✅ Exito',
        message: 'Inventario finalizado correctamente.',
        buttons: ['OK']
      });
      await alert.present();

      alert.onDidDismiss().then(() => {
        this.router.navigate(['/login']);
      });
    } catch (error: any) {
      console.error('Error al finalizar inventario:', error);

      let errorMessage = 'No se pudo finalizar el inventario.';

      if (error?.error?.message) errorMessage = error.error.message;
      else if (error?.status === 400) errorMessage = 'Datos invalidos. Verifica la informacion.';
      else if (error?.status === 404) errorMessage = 'Inventario no encontrado.';

      const alert = await this.alertController.create({
        header: 'Error',
        message: errorMessage,
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  // === Iniciar inventario ===
  async iniciarInventario() {
    const zonaId = Number(this.route.snapshot.paramMap.get('zonaId'));
    if (!this.operatingGroupId) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'No se pudo obtener el grupo operativo.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    // Usa el SSOT para verificar si ya hay inventario activo
    const currentInventaryId = this.inventoryStateService.currentInventaryId();
    if (currentInventaryId) {
      this.router.navigate(['/scanner/', zonaId]);
      return;
    }

    const alert = await this.alertController.create({
      header: 'Iniciar inventario',
      message: '¿Estas seguro de iniciar el inventario en esta zona?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Iniciar',
          handler: async () => { // Handler ahora es async
            const request: StartInventoryRequestDto = {
              zoneId: zonaId,
              operatingGroupId: this.operatingGroupId!,
            };

            try {
              // Llama al metodo del SSOT
              const res = await this.inventoryStateService.startInventory(request);

              // El SSOT ya establecio el inventaryId y la conexion SignalR
              if (res?.inventaryId) {
                console.log('Inventario iniciado con ID:', res.inventaryId);
                this.router.navigate(['/scanner', zonaId]);
              } else {
                throw new Error('No se recibio ID del inventario.');
              }
            } catch (err) {
              const errorAlert = await this.alertController.create({
                header: 'Error',
                message: 'No se pudo iniciar el inventario.',
                buttons: ['OK'],
              });
              await errorAlert.present();
            }
          },
        },
      ],
    });

    await alert.present();
  }
}
