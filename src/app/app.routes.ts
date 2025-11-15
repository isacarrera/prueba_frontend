import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full',
  },
  {
    path: 'welcome',
    loadComponent: () =>
      import('./pages/welcome/welcome.page').then((m) => m.WelcomePage),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'verificador',
    loadComponent: () =>
      import('./pages/verificador/verificador.page').then(
        (m) => m.VerificadorPage
      ),
  },
  {
    path: 'operativo',
    loadComponent: () =>
      import('./pages/operativo/operativo.page').then((m) => m.OperativoPage),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'inicio-operativo/:zonaId',
    loadComponent: () =>
      import('./pages/inicio-operativo/inicio-operativo.page').then(
        (m) => m.InicioOperativoPage
      ),
  },
  {
    path: 'inicio-mouse/:id/:zonaId',
    loadComponent: () =>
      import('./pages/inicio-mouse/inicio-mouse.page').then(
        (m) => m.InicioMousePage
      ),
  },
  {
    path: 'verificador-operativo',
    loadComponent: () =>
      import('./pages/verificador-operativo/verificador-operativo.page').then(
        (m) => m.VerificadorOperativoPage
      ),
  },
  {
    path: 'revision-inventario',
    loadComponent: () =>
      import('./pages/revision-inventario/revision-inventario.page').then(
        (m) => m.RevisionInventarioPage
      ),
  },

  {
    path: 'items/:zonaId',
    loadComponent: () =>
      import('./pages/items-page/items-page.page').then((m) => m.ItemsPage),
  },

  {
    path: 'scanner/:zonaId',
    loadComponent: () =>
      import('./components/scanner/scanner.page').then((m) => m.ScannerPage),
  },
  {
    path: 'detalle-verificacion/:inventaryId',
    loadComponent: () =>
      import('./pages/detalle-verificacion/detalle-verificacion.component').then(
        (m) => m.DetalleVerificacionPage
      ),
  }, {
    path: 'detalle-inventario',
    loadComponent: () => import('./pages/detalle-inventario/detalle-inventario.page').then(m => m.DetalleInventarioPage)
  },
];
