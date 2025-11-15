import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonSelect,
  IonSelectOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  appsOutline,
  arrowBackOutline,
  chevronDownOutline,
  documentTextOutline,
  keypadOutline
} from 'ionicons/icons';
import { AuthService } from 'src/app/services/auth.service';
import { SignalrService } from 'src/app/services/Connections/signalr.service';

@Component({
  selector: 'app-operativo',
  templateUrl: './operativo.page.html',
  styleUrls: ['./operativo.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonInput,
    CommonModule,
    FormsModule,
    IonContent
  ],
})
export class OperativoPage {
  tipoDoc?: string;
  numeroDoc = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private signalrService: SignalrService
  ) {
    addIcons({
      keypadOutline,
      arrowBackOutline,
      appsOutline,
      documentTextOutline,
      chevronDownOutline
    });
  }

  goBack() {
    this.router.navigate(['/login']);
  }

  // Metodo para validar y limitar el input del numero de documento
  onDocumentNumberInput(event: any) {
    let value = event.detail.value;

    // Solo permitir numeros
    value = value.replace(/[^0-9]/g, '');

    // Limitar a 10 caracteres maximo
    if (value.length > 10) {
      value = value.substring(0, 10);
    }

    // Actualizar el modelo y el input
    this.numeroDoc = value;
    event.target.value = value;

    // Prevenir que se escriba más de 10 caracteres
    if (value.length >= 10) {
      event.target.setAttribute('maxlength', '10');
    }
  }

  acceder() {
    if (!this.tipoDoc || !this.numeroDoc) {
      this.showAlert('Error', 'Debes completar los datos.');
      return;
    }

    // Validación adicional de longitud
    if (this.numeroDoc.length > 10) {
      this.showAlert('Error', 'El número de documento no puede tener más de 10 dígitos.');
      return;
    }

    this.authService.loginOperativo(this.tipoDoc, this.numeroDoc).subscribe({
      next: async (res: any) => {
        console.log('Login exitoso, iniciando SignalR...');
        this.signalrService.startConnection();
        this.router.navigate(['/home']);
      },
      error: async (err: Error) => {
        console.error('Error en login:', err);
        this.showAlert('Acceso denegado', err.message);
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
