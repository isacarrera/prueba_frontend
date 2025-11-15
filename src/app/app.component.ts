import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { NavController, Platform } from '@ionic/angular';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AuthInterceptor } from './services/auth.interceptor';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }]
})
export class AppComponent {
  constructor(private platform: Platform, private router: Router, private navController: NavController) { }
  
  ngOnInit() { };

  setupBackButtonHandler() {
    // Usamos 'subscribeWithPriority' para asegurarnos de que nuestra 
    // lógica se ejecute antes que la acción por defecto (salir de la app).
    // El '10' es una prioridad estándar para esto.
    this.platform.backButton.subscribeWithPriority(10, () => {

      // Obtenemos la URL actual
      const currentUrl = this.router.url;

      // --- ¡IMPORTANTE! ---
      // Aquí debes listar todas las URLs que consideras "raíz" o "principales".
      // Es decir, las páginas donde si el usuario da "atrás", SÍ debe salir.
      const rootPages = [
        '/login'
      ];

      // 1. Comprobamos si estamos en una página "raíz"
      if (rootPages.includes(currentUrl)) {
        // Si estamos en una página raíz, salimos de la app
        App.exitApp();
      } else {
        // 2. Si NO estamos en una página raíz, usamos NavController
        // para navegar "hacia atrás" dentro de la app.
        this.navController.back();
      }
    });
  }
}