import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  documentTextOutline,
  warningOutline,
  helpCircleOutline,
  swapHorizontalOutline,
  bulbOutline,
  createOutline,
  closeCircleOutline,
  checkmarkCircleOutline,
  informationCircleOutline
} from 'ionicons/icons';

import { InventoryService } from 'src/app/services/inventary.service';
import { NotificationService } from 'src/app/services/notification.service';
import { ZonasInventarioService } from 'src/app/services/zonas-inventario.service';
import { InvenService } from 'src/app/services/inven.service';
import { AuthService } from 'src/app/services/auth.service';
import { CheckerService } from 'src/app/services/checker.service';

import { InventoryCompareItem, InventoryCompareResponse } from 'src/app/Interfaces/inventory-compare.model';
import { InventoryDifference, InventoryNotificationRequest } from 'src/app/Interfaces/inventory-notification.model';

@Component({
  selector: 'app-detalle-verificacion',
  templateUrl: './detalle-verificacion.component.html',
  styleUrls: ['./detalle-verificacion.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class DetalleVerificacionPage implements OnInit, OnDestroy {

  inventaryId!: number;
  comparacion!: InventoryCompareResponse;
  cargando = true;
  showIcon = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inventoryService: InventoryService,
    private alertCtrl: AlertController,
    private notificationService: NotificationService,
    private zonasInventarioService: ZonasInventarioService,
    private inventService: InvenService,
    private authService: AuthService,
    private checkerService: CheckerService
  ) {
    addIcons({
      arrowBackOutline,
      documentTextOutline,
      warningOutline,
      helpCircleOutline,
      swapHorizontalOutline,
      bulbOutline,
      createOutline,
      closeCircleOutline,
      checkmarkCircleOutline,
      informationCircleOutline
    });
  }

  // =====================================================
  // Ciclo de vida
  // =====================================================

  ngOnInit() {
    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize.bind(this));

    const idParam = this.route.snapshot.paramMap.get('inventaryId');
    if (!idParam) {
      this.mostrarAlerta('Error', 'ID de inventario no proporcionado.');
      this.volver();
      return;
    }

    this.inventaryId = +idParam;
    if (isNaN(this.inventaryId)) {
      this.mostrarAlerta('Error', 'ID de inventario inválido.');
      this.volver();
      return;
    }

    this.cargarComparacion();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.checkScreenSize.bind(this));
  }

  private checkScreenSize() {
    this.showIcon = window.innerWidth > 400;
  }

  // =====================================================
  // UI
  // =====================================================

  getOverallStatus(): string {
    if (!this.comparacion) return 'clean';

    const totalIssues =
      (this.comparacion.missingItems?.length || 0) +
      (this.comparacion.unexpectedItems?.length || 0) +
      (this.comparacion.stateMismatches?.length || 0);

    if (totalIssues === 0) return 'clean';
    if (totalIssues <= 2) return 'issues';
    return 'critical';
  }

  getStatusText(): string {
    const status = this.getOverallStatus();
    switch (status) {
      case 'clean': return 'Sin problemas';
      case 'issues': return 'Atención requerida';
      case 'critical': return 'Problemas críticos';
      default: return 'En verificación';
    }
  }

  // =====================================================
  // Lógica
  // =====================================================

  async cargarComparacion() {
    try {
      const data = await firstValueFrom(
        this.inventoryService.getComparacion(this.inventaryId)
      );
      this.comparacion = data;
    } catch (err) {
      console.error('Error al cargar la comparación:', err);
      this.mostrarAlerta('Error', 'No se pudo cargar el reporte de verificación.');
    } finally {
      this.cargando = false;
    }
  }

  volver() {
    this.router.navigate(['/revision-inventario']);
  }

  // =====================================================
  // Negar / Confirmar con AlertController
  // =====================================================

  async negarVerificacion() {
    const alert = await this.alertCtrl.create({
      header: 'Negar verificación',
      message: 'Por favor escribe el motivo de la negación:',
      inputs: [
        {
          name: 'observations',
          type: 'textarea',
          placeholder: 'Escribe tus observaciones aquí...'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'alert-cancel' },
        {
          text: 'Enviar',
          cssClass: 'alert-destructive',
          handler: async (data) => {
            const observaciones = (data?.observations ?? '').trim();
            if (!observaciones) {
              await this.mostrarAlerta('Atención', 'Debes escribir observaciones para negar la verificación.');
              return false;
            }
            await this.enviarCierre(false, observaciones);
            return true;
          }
        }
      ],
      cssClass: 'custom-alert'
    });

    await alert.present();
  }

  async confirmarCierre() {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Verificación',
      message: '¿Deseas confirmar esta verificación? (observaciones opcionales)',
      inputs: [
        {
          name: 'observations',
          type: 'textarea',
          placeholder: 'Observaciones (opcional)'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'alert-cancel' },
        {
          text: 'Confirmar',
          cssClass: 'alert-confirm',
          handler: async (data) => {
            const observaciones = (data?.observations ?? '').trim();
            await this.enviarCierre(true, observaciones);
            return true;
          }
        }
      ],
      cssClass: 'custom-alert'
    });

    await alert.present();
  }

  // =====================================================
  // Envío y notificación
  // =====================================================

  private async enviarCierre(result: boolean, observaciones: string) {
    this.cargando = true;

    try {
      // 🔹 Guardar resultado de la verificación
      await firstValueFrom(
        this.inventoryService.confirmarVerificacion(
          this.inventaryId,
          observaciones,
          result
        )
      );

      // 🔸 Si la verificación fue negada → generar notificación
      if (!result) {
        const currentUser = await this.authService.getUserFromToken();
        const userId = currentUser?.userId;
        if (!userId) throw new Error('No se pudo obtener el usuario actual.');

        const checker = await firstValueFrom(this.checkerService.GetOperatingId(userId));
        const checkerName = checker?.name || checker?.userName || 'Verificador desconocido';

        const inventario = await firstValueFrom(this.inventService.getById(this.inventaryId));
        const zoneId = inventario?.zoneId;
        const inventaryDate = inventario?.date || new Date().toISOString();
        const operatingGroupName = inventario?.operatingGroupName || 'Sin grupo';
        if (!zoneId) throw new Error('No se encontró zona asociada al inventario.');

        const zona = await firstValueFrom(this.zonasInventarioService.getById(zoneId));
        const inChargeId = zona?.inChargeId;
        if (!inChargeId) throw new Error('No se encontró encargado asignado a la zona.');

        const cmp = this.comparacion;
        const differences: InventoryDifference[] = [
          ...cmp.missingItems.map<InventoryDifference>((i: InventoryCompareItem) => ({
            itemId: i.itemId,
            code: i.code,
            name: i.name,
            category: i.reason || 'Sin categoría',
            baseState: 'NO ENCONTRADO',
            inventoryState: 'FALTANTE'
          })),
          ...cmp.unexpectedItems.map<InventoryDifference>((i: InventoryCompareItem) => ({
            itemId: i.itemId,
            code: i.code,
            name: i.name,
            category: i.reason || 'Sin categoría',
            baseState: 'NO ESPERADO',
            inventoryState: 'EXTRA'
          })),
          ...cmp.stateMismatches.map<InventoryDifference>((i: InventoryCompareItem) => ({
            itemId: i.itemId,
            code: i.code,
            name: i.name,
            category: i.reason || 'Sin categoría',
            baseState: i.expectedState || 'DESCONOCIDO',
            inventoryState: i.scannedState || 'DESCONOCIDO'
          }))
        ];

        const payload: InventoryNotificationRequest = {
          userId: inChargeId,
          content: {
            inventaryId: this.inventaryId,
            inventaryDate: new Date(inventaryDate).toISOString().replace('Z', '+00:00'),
            operatingGroupName,
            checkerName,
            checkerObservation: observaciones,
            differences
          }
        };

        console.log('📦 Payload final enviado:', payload);

        await this.notificationService.sendInventoryNotification(payload);
      }

      const msg = result
        ? '✅ Verificación confirmada correctamente.'
        : '⚠️ Verificación negada. Se notificará al responsable.';
      await this.mostrarAlerta('Éxito', msg);
      this.volver();

    } catch (err: any) {
      console.error('Error al enviar verificación o notificación:', err);
      this.mostrarAlerta('Error', err.message || '❌ No se pudo guardar la verificación.');
    } finally {
      this.cargando = false;
    }
  }

  // =====================================================
  // Utilidad
  // =====================================================

  private async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  verDetalle(title: string, items: any[]) {
    // 1. Prepara los datos a pasar (la lista completa y el título)
    const navigationExtras: NavigationExtras = {
        state: {
            title: title,
            // Pasamos el array completo de ítems que le corresponde a ese acordeón
            allItems: items 
        }
    };
    
    // 2. Navega a la nueva página genérica.
    this.router.navigate(['/detalle-inventario'], navigationExtras);
}
}
