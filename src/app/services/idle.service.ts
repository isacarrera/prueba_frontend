import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService } from './auth.service';
import { Subject } from 'rxjs/internal/Subject';

// idle.service.ts
@Injectable({ providedIn: 'root' })
export class IdleService {
  private idleTimeout: any;
  private warningTimeout: any;
  private currentAlert: HTMLIonAlertElement | null = null;

  private readonly idleTime = 3 * 60 * 1000;
  private readonly warningTime = 30 * 1000;

  private logoutSubject = new Subject<void>();
  logout$ = this.logoutSubject.asObservable(); 

  constructor(
    private router: Router,
    private ngZone: NgZone,
    private alertController: AlertController
  ) {}

  startWatching() {
    this.resetTimer();
    window.addEventListener('mousemove', () => this.resetTimer());
    window.addEventListener('keydown', () => this.resetTimer());
    window.addEventListener('touchstart', () => this.resetTimer());
  }

  private resetTimer() {
    clearTimeout(this.idleTimeout);
    clearTimeout(this.warningTimeout);

    this.warningTimeout = setTimeout(() => this.showWarning(), this.idleTime - this.warningTime);
    this.idleTimeout = setTimeout(() => this.forceLogout(), this.idleTime);
  }

  private async showWarning() {
    if (this.router.url.includes('/login')) return;
    if (this.router.url.includes('/operativo')) return;
    if (this.router.url.includes('/verificador')) return; 
    if (this.currentAlert) return;

    const alert = await this.alertController.create({
      header: 'Inactividad',
      message: 'Tu sesión se cerrará en 30 segundos si no interactúas.',
      buttons: [
        {
          text: 'Seguir conectado',
          role: 'cancel',
          handler: () => {
            this.resetTimer(); 
            this.currentAlert = null;
          }
        }
      ]
    });

    this.currentAlert = alert;
    await alert.present();

    alert.onDidDismiss().then(() => {
      if (this.currentAlert === alert) {
        this.currentAlert = null;
      }
    });
  }

  private async forceLogout() {
    if (this.router.url.includes('/login')) return;
    if (this.router.url.includes('/operativo')) return;
    if (this.router.url.includes('/verificador')) return;
    if (this.currentAlert) {
      try { await this.currentAlert.dismiss(); } catch {}
      this.currentAlert = null;
    }

    // 🚨 avisar que toca cerrar sesión
    this.logoutSubject.next();
    const alert = await this.alertController.create({
        header: 'Sesión cerrada',
        message: 'Tu sesión ha expirado por inactividad.',
        buttons: ['OK']
      });

    await alert.present();
    this.router.navigate(['/login']);
  }

  stopWatching() {
    clearTimeout(this.idleTimeout);
    clearTimeout(this.warningTimeout);
    this.currentAlert = null;
  }
}
