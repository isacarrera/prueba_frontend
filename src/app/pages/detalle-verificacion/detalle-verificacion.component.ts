import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { IonicModule } from '@ionic/angular';      
import { CommonModule } from '@angular/common';   
import { FormsModule } from '@angular/forms';     
import { InventoryService } from 'src/app/services/inventary.service';
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

@Component({
  selector: 'app-detalle-verificacion',
  templateUrl: './detalle-verificacion.component.html',
  styleUrls: ['./detalle-verificacion.component.scss'],
  standalone: true, 
  imports: [
    IonicModule,   
    CommonModule,   
    FormsModule     
  ]
})
export class DetalleVerificacionPage implements OnInit, OnDestroy {
  inventaryId!: number;
  comparacion: any = null;
  cargando = true;
  observaciones = '';
  showIcon = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inventoryService: InventoryService,
    private alertCtrl: AlertController
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

  // Métodos auxiliares para la vista
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
    switch(status) {
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
        { 
          text: 'Cancelar', 
          role: 'cancel',
          cssClass: 'alert-cancel'
        },
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
        { 
          text: 'Cancelar', 
          role: 'cancel',
          cssClass: 'alert-cancel'
        },
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
      await firstValueFrom(
        this.inventoryService.confirmarVerificacion(
          this.inventaryId,
          this.observaciones,
          result
        )
      );
      
      const msg = result 
        ? '✅ Verificación confirmada correctamente.' 
        : '⚠️ Verificación negada. Se notificará al responsable.';
      
      await this.mostrarAlerta('Éxito', msg);
      this.volver();
    } catch (err) {
      console.error('Error al enviar verificación:', err);
      this.mostrarAlerta('Error', '❌ No se pudo guardar la verificación.');
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