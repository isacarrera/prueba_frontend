import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  chatbubbleEllipsesOutline,
  checkmarkDoneOutline,
  checkmarkOutline,
  closeOutline,
  cloudUploadOutline,
  documentTextOutline,
  ellipsisHorizontalCircleOutline,
  homeOutline,
  informationCircleOutline,
  logOutOutline,
  personAddOutline,
  personCircleOutline,
  qrCodeOutline,
  readerOutline,
} from 'ionicons/icons';

// Servicios
import { firstValueFrom } from 'rxjs';
import { FinishRequestDto } from 'src/app/Interfaces/finish-request.model';
import { StartInventoryRequestDto } from 'src/app/Interfaces/start-inventory-request.model';
import { AuthService } from 'src/app/services/auth.service';
import { CategoryService } from 'src/app/services/category.service';
import { InventoryService } from 'src/app/services/inventary.service';
import { OperatingService } from 'src/app/services/operating.service';
import { ZonasInventarioService } from 'src/app/services/zonas-inventario.service';

// Modelos

@Component({
  selector: 'app-inicio-operativo',
  templateUrl: './inicio-operativo.page.html',
  styleUrls: ['./inicio-operativo.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class InicioOperativoPage implements OnInit {
  categorias: any[] = [];
  cargando = true;
  operatingGroupId: number | null = null;
  isInviteOpen = false;
  code = ['D', '8', 'K', '4'];

  // Modales de observaciones
  isObservacionesOpen = false;
  observacionTexto: string = '';

  // Modales de sistema
  isExitOpen = false;
  isConfirmOpen = false;
  isExportOpen = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private inventaryService: InventoryService,
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

    // Cargar categorías
    this.categoryService.getItemsByCategory(zonaId).subscribe({
      next: (data) => {
        // Asumiendo que 'data' es un array de categorías
        // y que 'contador' es parte de cada objeto de categoría
        this.categorias = data;
        this.cargando = false;

      },
      error: (err) => {
        console.error('Error cargando categorías:', err);
        this.cargando = false;
      },
    });


    // Obtener operatingGroupId
    if (userId) {
      this.operatingService.GetOperatingId(userId).subscribe({
        next: (data) => {
          console.log('Operating obtenido:', data);
          this.operatingGroupId = data.operatingGroupId;
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

      // Obtener zonas del usuario (cada una tiene su branchId)
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

      // Tomar el branchId de la primera zona (ajusta si necesitas elegir)
      const branchId = zonas[0].branchId;

      // Navegar al escáner en modo descripción
      this.router.navigate(['/scanner', branchId], {
        state: {
          scanMode: 'description',
          isGuest: false
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
  goToItem(categoria: any) {
    this.router.navigate(
      [
        '/inicio-mouse',
        categoria.id,
        this.route.snapshot.paramMap.get('zonaId'),
      ],
      {
        state: { categoria },
      }
    );
  }

  // === Modales ===
  openInviteModal() {
    this.isInviteOpen = true;
  }
  closeInviteModal() {
    this.isInviteOpen = false;
  }

  // Estado para mostrar/ocultar modal de instrucciones
  isInstructionsOpen = false;

  // Métodos para abrir y cerrar el modal
  openInstructionsModal() {
    this.isInstructionsOpen = true;
  }

  closeInstructionsModal() {
    this.isInstructionsOpen = false;
  }
  openObservacionesModal() {
    this.isObservacionesOpen = true;
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

  // === Guardar observación ===
  async guardarObservacion() {
    console.log('Observación guardada:', this.observacionTexto || '(sin texto)');
    this.closeObservacionesModal();

    const alert = await this.alertController.create({
      header: '✅ Observación guardada',
      message: this.observacionTexto.trim()
        ? 'Tu observación ha sido guardada correctamente.'
        : 'No escribiste ninguna observación, pero fue guardada como vacía.',
      buttons: ['OK'],
    });
    await alert.present();
  }

  // === Lógica de Finalizar Inventario (REESTRUCTURADA) ===

  async finalizarInventario() {


    const totalEsperado = this.categorias.reduce((sum, cat) => {

      return sum + (cat.contador || 0);
    }, 0);

    const totalEscaneado = this.inventaryService.getScannedItems().length;


    if (totalEscaneado < totalEsperado) {
      const itemsFaltantes = totalEsperado - totalEscaneado;

      const alert = await this.alertController.create({
        header: '⚠️ ¡Atención!',
        message: `Has escaneado ${totalEscaneado} de ${totalEsperado} ítems.\n\nFaltan ${itemsFaltantes} ítems. ¿Estás seguro de que quieres finalizar?`,
        cssClass: 'custom-alert',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            cssClass: 'alert-button-cancel',
            handler: () => {
              console.log('Finalización cancelada por el usuario.');
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
      // Si el inventario está completo, proceder normalmente
      console.log('Inventario completo o igualado (Esto es lo que está pasando). Finalizando...');
      this.procederConFinalizacion();
    }
  }

  async procederConFinalizacion() {
    const inventaryId = this.inventaryService.getInventaryId();

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
      await this.inventaryService.finish(request).toPromise();

      this.inventaryService.setInventaryId(0);
      this.observacionTexto = '';
      this.closeConfirmModal();

      const alert = await this.alertController.create({
        header: '✅ Éxito',
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
      else if (error?.status === 400) errorMessage = 'Datos inválidos. Verifica la información.';
      else if (error?.status === 404) errorMessage = 'Inventario no encontrado.';

      const alert = await this.alertController.create({
        header: 'Error',
        message: errorMessage,
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  // === Iniciar inventario (sin cambios) ===
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

    const currentInventaryId = this.inventaryService.getInventaryId();
    if (currentInventaryId) {
      this.router.navigate(['/scanner', zonaId], {
        state: { isGuest: false }
      });
      return;
    }

    const alert = await this.alertController.create({
      header: 'Iniciar inventario',
      message: '¿Estás seguro de iniciar el inventario en esta zona?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Iniciar',
          handler: async () => {
            const request: StartInventoryRequestDto = {
              zoneId: zonaId,
              operatingGroupId: this.operatingGroupId!,
            };

            try {
              const res = await firstValueFrom(this.inventaryService.start(request));

              if (!res || !res.inventaryId) {
                throw new Error('El backend no devolvió un ID de inventario.');
              }

              this.inventaryService.setInventaryId(res.inventaryId);

              this.router.navigate(['/scanner', zonaId], {
                state: { isGuest: false }
              });

            } catch (err: any) {
              // await loading.dismiss();
              const errorAlert = await this.alertController.create({
                header: 'Error',
                message: err?.message || 'No se pudo iniciar el inventario.',
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

  // === Confirmar inventario (notificacion) ===
  confirmarInventario() {
    console.log('Inventario confirmado y notificado al encargado de zona');
    this.closeConfirmModal();
  }
}
