import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { InventoryCompareItem, InventoryCompareResponse } from 'src/app/Interfaces/inventory-compare.model';
import { InventoryDifference, InventoryNotificationRequest } from 'src/app/Interfaces/inventory-notification.model';
import { ZonasInventarioService } from 'src/app/services/zonas-inventario.service';
import { InvenService } from 'src/app/services/inven.service';
import { AuthService } from 'src/app/services/auth.service';
import { CheckerService } from 'src/app/services/checker.service';


@Component({
  selector: 'app-detalle-verificacion',
  templateUrl: './detalle-verificacion.component.html',
  styleUrls: ['./detalle-verificacion.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class DetalleVerificacionPage implements OnInit, OnDestroy {
  inventaryId!: number;
  comparacion!: InventoryCompareResponse;
  cargando = true;
  observaciones = '';
  showIcon = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inventoryService: InventoryService,
    private alertCtrl: AlertController,
    private notificationService: NotificationService,
    private zonasInventarioService: ZonasInventarioService,
    private inventService: InvenService,
    private authService : AuthService,
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

  async cargarComparacion() {
    try {
      const data = await firstValueFrom(
        this.inventoryService.getComparacion(this.inventaryId)
      );
      this.comparacion = data;
      this.observaciones = data.observations || '';
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

  async negarVerificacion() {
    const alert = await this.alertCtrl.create({
      header: '¿Negar verificación?',
      message: 'Esto indicará que hay problemas graves que requieren revisión.',
      cssClass: 'custom-alert',
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'alert-cancel' },
        {
          text: 'Negar',
          role: 'destructive',
          cssClass: 'alert-destructive',
          handler: () => this.enviarCierre(false)
        }
      ]
    });
    await alert.present();
  }

  async confirmarCierre() {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Verificación',
      message: '¿Estás seguro de que todo está en orden y deseas confirmar esta verificación?',
      cssClass: 'custom-alert',
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'alert-cancel' },
        {
          text: 'Confirmar',
          cssClass: 'alert-confirm',
          handler: () => this.enviarCierre(true)
        }
      ]
    });
    await alert.present();
  }

  private async enviarCierre(result: boolean) {
    this.cargando = true;

    try {
      // 🔹 Guardar resultado de la verificación
      await firstValueFrom(
        this.inventoryService.confirmarVerificacion(
          this.inventaryId,
          this.observaciones,
          result
        )
      );

      // Solo si se niega la verificación
      if (!result) {
        // 🧩 1. Obtener usuario logueado desde token
        const currentUser = await this.authService.getUserFromToken();
        const userId = currentUser?.userId;
        if (!userId) throw new Error('No se pudo obtener el usuario actual.');

        // 🧩 2. Obtener información del checker (verificador)
        const checker = await firstValueFrom(
          this.checkerService.GetOperatingId(userId)
        );
        const checkerName = checker?.name || checker?.userName || 'Verificador desconocido';

        // 🧩 3. Obtener inventario → fecha, grupo, zona
        const inventario = await firstValueFrom(
          this.inventService.getById(this.inventaryId)
        );
        const zoneId = inventario?.zoneId;
        const inventaryDate = inventario?.date || new Date().toISOString();
        const operatingGroupName = inventario?.operatingGroupName || 'Sin grupo';

        if (!zoneId) throw new Error('No se encontró zona asociada al inventario.');

        // 🧩 4. Obtener zona → encargado
        const zona = await firstValueFrom(
          this.zonasInventarioService.getById(zoneId)
        );
        const inChargeId = zona?.inChargeId;
        if (!inChargeId) throw new Error('No se encontró encargado asignado a la zona.');

        // 🧩 5. Construir arreglo de diferencias
        const comparacion = this.comparacion;
        const differences: InventoryDifference[] = [
          ...comparacion.missingItems.map<InventoryDifference>((i: InventoryCompareItem) => ({
            itemId: i.itemId,
            code: i.code,
            name: i.name,
            category: i.reason || 'Sin categoría',
            baseState: 'NO ENCONTRADO',
            inventoryState: 'FALTANTE'
          })),
          ...comparacion.unexpectedItems.map<InventoryDifference>((i: InventoryCompareItem) => ({
            itemId: i.itemId,
            code: i.code,
            name: i.name,
            category: i.reason || 'Sin categoría',
            baseState: 'NO ESPERADO',
            inventoryState: 'EXTRA'
          })),
          ...comparacion.stateMismatches.map<InventoryDifference>((i: InventoryCompareItem) => ({
            itemId: i.itemId,
            code: i.code,
            name: i.name,
            category: i.reason || 'Sin categoría',
            baseState: i.expectedState || 'DESCONOCIDO',
            inventoryState: i.scannedState || 'DESCONOCIDO'
          }))
        ];

        // 🧩 6. Armar payload completo con datos reales
        const payload: InventoryNotificationRequest = {
          userId: inChargeId,
          content: {
            inventaryId: this.inventaryId,
            inventaryDate: new Date(inventaryDate).toISOString().replace('Z', '+00:00'),
            operatingGroupName,
            checkerName,
            checkerObservation: this.observaciones,
            differences
          }
        };

        console.log('📦 Payload final enviado:', payload);

        // 🧩 7. Enviar notificación al backend
        await this.notificationService.sendInventoryNotification(payload);
      }

      // Mensaje de éxito
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




  private async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }
}
