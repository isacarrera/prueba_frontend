import { Component } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBackOutline, lockClosedOutline, lockOpenOutline } from 'ionicons/icons';
import { ZonasInventarioService } from 'src/app/services/zonas-inventario.service';
import { AuthService } from 'src/app/services/auth.service';
import { ZonaInventario } from 'src/app/Interfaces/zone.model';

@Component({
  selector: 'app-verificador-operativo',
  templateUrl: './verificador-operativo.page.html',
  styleUrls: ['./verificador-operativo.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class VerificadorOperativoPage {
  searchTerm = '';
  zonas: ZonaInventario[] = [];
  cargando = true;

  constructor(
    private router: Router,
    private zonasService: ZonasInventarioService,
    private authService: AuthService,
    private alertController: AlertController
  ) {
    addIcons({ arrowBackOutline, lockClosedOutline, lockOpenOutline });
  }

  async ionViewWillEnter() {
    const user = await this.authService.getUserFromToken();
    if (user?.userId) {
      this.cargarZonas(user.userId);
    }
  }

  goBack() {

    this.router.navigate(['/verificador']);
  }

 goToOperativo(id: number) {
  this.router.navigate(['/revision-inventario', id]);
}

  filteredZonas() {
    if (!this.searchTerm) return this.zonas;
    return this.zonas.filter(z =>
      z.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  private cargarZonas(userId: number) {
    this.zonasService.getZonas(userId).subscribe({
      next: async data => {
        this.zonas = data;
        this.cargando = false;
        if (!this.zonas.length) {
          await this.mostrarAlerta('Aviso', 'No tienes inventarios asignados.');
        }
      },
      error: async err => {
        console.error('Error al cargar zonas', err);
        this.cargando = false;
        const msg =
          err.status === 404
            ? 'No tienes inventarios asignados.'
            : 'Ocurrió un problema al cargar las zonas.';
        await this.mostrarAlerta('Error', msg);
      },
    });
  }

  private async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
