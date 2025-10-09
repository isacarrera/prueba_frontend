import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import {
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonItem,
  IonList,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonHeader,
  IonToolbar,
  IonBackButton,
  IonTitle,
  IonLabel,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  keypadOutline,
  appsOutline,
  documentTextOutline,
  chevronDownOutline
  
} from 'ionicons/icons';

@Component({
  selector: 'app-operativo',
  templateUrl: './operativo.page.html',
  styleUrls: ['./operativo.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonItem,
    IonList,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonHeader,
    IonToolbar,
    IonBackButton,
    IonTitle,
    IonLabel,
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
    private alertCtrl: AlertController
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

  acceder() {
    // console.log('DEBUG >> TipoDoc:', this.tipoDoc, 'NumeroDoc:', this.numeroDoc);

    if (!this.tipoDoc || !this.numeroDoc) {
      this.showAlert('Datos incompletos', 'Debes seleccionar tipo y número de documento.');
      return;
    }
  
    this.authService.loginOperativo(this.tipoDoc, this.numeroDoc).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: async (err) => {
        let msg = 'Ocurrió un error al iniciar sesión.';
        if (err.status === 401) {
          msg = err.error || 'Credenciales inválidas o rol no autorizado.';
        }
        await this.showAlert('Acceso denegado', msg);
      }
    });
  }

  unirse() {
    this.router.navigate(['/unirse']);
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