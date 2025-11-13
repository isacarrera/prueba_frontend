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

  acceder() {
    if (!this.tipoDoc || !this.numeroDoc) { /* ... validación ... */ return; }

    this.authService.loginOperativo(this.tipoDoc, this.numeroDoc).subscribe({
      next: async () => { // Hacemos el callback async
        console.log('🔐 Login exitoso, iniciando conexión socket...');

        // 👇 INICIAR SIGNALR AQUÍ
        // No usamos await para no bloquear la navegación, que conecte en segundo plano
        this.signalrService.startConnection();

        this.router.navigate(['/home']);
      },
      error: async (err) => { /* ... manejo de error ... */ }
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
