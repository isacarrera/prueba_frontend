import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AuthInterceptor } from './services/auth.interceptor';
import { BackButtonService } from './services/Common/back-button.service';

/**
 * 🎯 AppComponent refactorizado
 * Manejo centralizado del hardware back button mediante servicio
 */
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
})
export class AppComponent {
  private readonly backButtonService = inject(BackButtonService);

  ngOnInit() {
    // Inicializar el manejador del hardware back button
    this.backButtonService.initializeBackButtonHandler();
  }
}
