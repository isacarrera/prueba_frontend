import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  chevronDownCircleOutline,
  lockClosedOutline,
  lockOpenOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';
import { ZonaInventarioBranch } from 'src/app/Interfaces/zone.model';
import { AuthService } from 'src/app/services/auth.service';
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

  constructor(
    private router: Router,
    private zonasService: ZonasInventarioService,
    private authService: AuthService,
    private alertController: AlertController
  ) {
    addIcons({
      arrowBackOutline,
      chevronDownCircleOutline,
      'lock-open-outline': lockOpenOutline,
      'lock-close-outline': lockClosedOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline
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

  goToOperativo(zonaId: number) {
    this.router.navigate(['/inicio-operativo', zonaId]);
  }

  filteredZonas() {
    if (!this.searchTerm) return this.zonas;
    return this.zonas.filter(z =>
      z.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
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
}
