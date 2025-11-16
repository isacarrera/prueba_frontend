import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { NavController, Platform } from '@ionic/angular';

/**
 * Servicio centralizado para manejar el botón físico de retroceso
 * Permite configurar comportamientos específicos por ruta
 */
@Injectable({
  providedIn: 'root'
})
export class BackButtonService {
  private readonly platform = inject(Platform);
  private readonly router = inject(Router);
  private readonly navController = inject(NavController);

  // Rutas donde presionar back debe salir de la app
  private readonly EXIT_ROUTES = ['/login'];

  // Rutas donde el componente maneja su propio back button
  // (tienen prioridad 15, este servicio usa prioridad 10)
  private readonly CUSTOM_HANDLER_ROUTES = ['/home'];

  /**
   * Inicializa el manejador global del hardware back button
   * Debe llamarse una sola vez desde AppComponent
   */
  initializeBackButtonHandler(): void {
    this.platform.backButton.subscribeWithPriority(10, async () => {
      const currentUrl = this.router.url;

      // Si la ruta tiene un handler personalizado (prioridad 15),
      // este código no se ejecutará gracias a la prioridad
      if (this.CUSTOM_HANDLER_ROUTES.includes(currentUrl)) {
        return; // El componente maneja su propio comportamiento
      }

      // Si estamos en una ruta de salida, cerrar la app
      if (this.EXIT_ROUTES.includes(currentUrl)) {
        await App.exitApp();
        return;
      }

      // Para cualquier otra ruta, navegar hacia atrás
      this.navController.back();
    });
  }

  /**
   * Verifica si la ruta actual es una ruta de salida
   */
  isExitRoute(url: string): boolean {
    return this.EXIT_ROUTES.includes(url);
  }

  /**
   * Verifica si la ruta actual tiene un handler personalizado
   */
  hasCustomHandler(url: string): boolean {
    return this.CUSTOM_HANDLER_ROUTES.includes(url);
  }
}
