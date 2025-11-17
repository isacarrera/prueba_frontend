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
import { SignalrService } from 'src/app/services/Connections/signalr.service';

@Component({
  selector: 'app-verificador',
  templateUrl: './verificador.page.html',
  styleUrls: ['./verificador.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class VerificadorPage {

  usuario = '';
  contrasena = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private signalrService: SignalrService
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

      // --- [ 3. MARCAR EL 'next' COMO ASYNC ] ---
      next: async (res) => {
        if (res?.token) {
          try {
            console.log('Login de Verificador exitoso, iniciando SignalR...');
            await this.signalrService.startConnection();
            console.log('SignalR conectado.');
          } catch (signalErr) {
            console.error('Error al conectar con SignalR', signalErr);
          }
          // ------------------------------------

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

  async recuperar() {
    const alert = await this.alertCtrl.create({
      header: 'Recuperar contraseña',
      message: 'Ingresa tu correo electrónico registrado',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'tu_correo@email.com'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Enviar',
          handler: (data) => {
            const email = data.email?.trim();
            if (!email) {
              this.showAlert('Error', 'Debes ingresar un correo válido');
              return false;
            }

            this.enviarSolicitudRecuperacion(email);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  private enviarSolicitudRecuperacion(email: string) {
    this.authService.forgotPassword(email).subscribe({
      next: (res) => {
        if (res?.success) {
          this.showAlert('Correo enviado', res.message || 'Revisa tu bandeja de entrada');
        } else {
          this.showAlert('Aviso', res.message || 'Si el correo está registrado, recibirás instrucciones');
        }
      },
      error: (err) => {
        console.error('Error al solicitar recuperación:', err);

        if (err.status === 0) {
          this.showAlert('Error', 'No hay conexión con el servidor.');
        } else {
          this.showAlert('Error', err.error?.message || 'No fue posible procesar la solicitud.');
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
