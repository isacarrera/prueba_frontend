import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { addIcons } from 'ionicons';
import {
  personOutline,
  keyOutline,
  lockClosedOutline,
  arrowBackOutline,
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

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

  try {
    const res = await firstValueFrom(this.authService.login(this.usuario, this.contrasena));

    if (res?.token) {
      this.showAlert('Acceso correcto', 'Bienvenido al sistema');
      this.router.navigate(['/revision-inventario']);
    } else {
      this.showAlert('Acceso denegado', 'Credenciales inválidas');
    }
  } catch (error) {
    console.error('Error en login:', error);
    this.showAlert('Error', 'No fue posible iniciar sesión.');
  }
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
