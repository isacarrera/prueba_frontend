import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules
} from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { importProvidersFrom } from '@angular/core';

import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { IonicStorageModule } from '@ionic/storage-angular';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { AuthInterceptor } from './app/services/auth.interceptor';

// ✅ Usa el cliente HTTP clásico con soporte completo para interceptores de clase
bootstrapApplication(AppComponent, {
  providers: [
    // Estrategia de ruteo de Ionic
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },

    // Configura Ionic y Router
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),

    // ✅ Importa el cliente HTTP clásico
    importProvidersFrom(
      HttpClientModule,
      IonicStorageModule.forRoot() // Inicializa almacenamiento
    ),

    // ✅ Inyecta tu interceptor
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
});
