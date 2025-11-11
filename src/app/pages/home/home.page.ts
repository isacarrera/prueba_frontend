import { Component } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  lockClosedOutline,
  lockOpenOutline,
  chevronDownCircleOutline
} from 'ionicons/icons';
import { ZonaInventario, ZonasInventarioService } from 'src/app/services/zonas-inventario.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class HomePage {
  searchTerm: string = '';
  zonas: ZonaInventario[] = [];
  cargando = true;

  constructor(
    private router: Router,
    private zonasService: ZonasInventarioService,
    private authService: AuthService,
    private alertController: AlertController
  ) {
    addIcons({
      arrowBackOutline,
      lockClosedOutline,
      lockOpenOutline,
      chevronDownCircleOutline
    });
  }

  // 👇 se ejecuta cada vez que la vista entra en pantalla
  async ionViewWillEnter() {
    await this.cargarZonas();
  }

  // 👇 MÉTODO NUEVO PARA PULL-TO-REFRESH
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

  // 👇 Método modificado para ser reutilizable
  async cargarZonas() {
    this.cargando = true;

    try {
      const user = await this.authService.getUserFromToken();
      if (user?.userId) {
        this.zonasService.getZonas(user.userId).subscribe({
          next: async (data) => {
            this.zonas = data;
            this.cargando = false;

            if (!this.zonas || this.zonas.length === 0) {
              const alert = await this.alertController.create({
                header: 'Aviso',
                message: 'No tienes inventarios asignados en este momento.',
                buttons: ['OK']
              });
              await alert.present();
            }
          },
          error: async (err) => {
            console.error('Error al cargar zonas', err);
            this.cargando = false;

            if (err.status === 404) {
              const alert = await this.alertController.create({
                header: 'Aviso',
                message: 'No tienes inventarios asignados en este momento.',
                buttons: ['OK']
              });
              await alert.present();
            } else {
              const alert = await this.alertController.create({
                header: 'Error',
                message: 'Ocurrió un problema al cargar las zonas.',
                buttons: ['OK']
              });
              await alert.present();
            }
          }
        });
      } else {
        this.cargando = false;
        console.error('Usuario no autenticado');
      }
    } catch (error) {
      this.cargando = false;
      console.error('Error al obtener usuario:', error);
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