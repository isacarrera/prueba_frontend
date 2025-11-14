import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  keyOutline,
  lockClosedOutline,
  personOutline,
} from 'ionicons/icons';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-verificador',
  templateUrl: './verificador.page.html',
  styleUrls: ['./verificador.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class VerificadorPage {
  recuperar() {
    throw new Error('Method not implemented.');
  }
  usuario = '';
  contrasena = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private alertCtrl: AlertController
  ) {
    addIcons({
      personOutline,
      keyOutline,
      lockClosedOutline,
      arrowBackOutline,
    });
  }

  goBack() {
    this.router.navigate(['/login']);
  }

  async acceder() {
    if (!this.usuario || !this.contrasena) {
      this.showAlert('Datos incompletos', 'Debes ingresar usuario y contraseña.');
      return;
    }

    this.authService.login(this.usuario, this.contrasena).subscribe({
      next: async (res) => {
        if (res?.token) {
          this.showAlert('Acceso correcto', 'Bienvenido al sistema');
          this.router.navigate(['/revision-inventario']);
        } else {
          this.showAlert('Acceso denegado', 'Credenciales inválidas');
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error en login:', error);

        if (error.status === 401) {
          this.showAlert('Acceso denegado', 'Usuario o contraseña incorrectos.');
        } else if (error.status === 0) {
          this.showAlert('Error de conexión', 'No hay conexión con el servidor.');
        } else {
          this.showAlert('Error', 'No fue posible iniciar sesión.');
        }
      }
    });
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
