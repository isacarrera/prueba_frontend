import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { IonicModule } from '@ionic/angular';      
import { CommonModule } from '@angular/common';   
import { FormsModule } from '@angular/forms';     
import { InventoryService } from 'src/app/services/inventary.service';

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
export class DetalleVerificacionPage implements OnInit {
  inventaryId!: number;
  comparacion: any = null;
  cargando = true;
  observaciones = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inventoryService: InventoryService,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
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


  volver() {
    this.router.navigate(['/revision-inventario']);
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

  async negarVerificacion() {
    const alert = await this.alertCtrl.create({
      header: '¿Negar verificación?',
      message: 'Esto indicará que hay problemas graves que requieren revisión.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Negar',
          role: 'destructive',
          handler: () => this.enviarCierre(false)
        }
      ]
    });
    await alert.present();
  }

  async confirmarCierre() {
    const alert = await this.alertCtrl.create({
      header: '¿Confirmar verificación?',
      message: '¿Estás seguro que todo está en orden?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: () => this.enviarCierre(true)
        }
      ]
    });
    await alert.present();
  }

  private async enviarCierre(result: boolean) {
    try {
      await firstValueFrom(
        this.inventoryService.confirmarVerificacion(
          this.inventaryId,
          this.observaciones,
          result // true = confirmar, false = negar
        )
      );
      const msg = result 
        ? 'Verificación confirmada correctamente.' 
        : 'Verificación negada. Se notificará al responsable.';
      
      await this.mostrarAlerta('Éxito', msg);
      this.volver();
    } catch (err) {
      console.error('Error al enviar verificación:', err);
      this.mostrarAlerta('Error', 'No se pudo guardar la verificación.');
    }
  }


  private async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}