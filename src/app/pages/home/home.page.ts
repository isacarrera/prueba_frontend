import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  appsOutline,
  arrowBackOutline,
  chevronDownCircleOutline,
  closeCircleOutline,
  lockClosedOutline,
  lockOpenOutline,
  personAddOutline,
  shieldCheckmarkOutline,
  addOutline,
  qrCodeOutline
} from 'ionicons/icons';
import { FilterState, StateZone, ZonaInventarioBranch, ZoneStateUpdate } from 'src/app/Interfaces/zone.model';
import { NavigationService } from 'src/app/services/Common/navigation.service';
import { InventoryGuestService } from 'src/app/services/Home/inventory-guest.service';
import { ZoneFacadeService } from 'src/app/services/Home/zone-facade.service';
import { AlertHelperService } from 'src/app/services/Common/alert-helper.service';
import { Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class HomePage implements OnInit, OnDestroy {

  private readonly zoneFacade = inject(ZoneFacadeService);
  private readonly guestService = inject(InventoryGuestService);
  private readonly navigationService = inject(NavigationService);
  private readonly alertHelper = inject(AlertHelperService);
  private readonly platform = inject(Platform);

  // Estado del componente
  searchTerm: string = '';
  zonas: ZonaInventarioBranch[] = [];
  cargando = true;
  filters: FilterState[] = [];
  activeFilter: StateZone | null = null;

  // Subscription del hardware back button
  private backButtonSubscription: any;

  // Signal
  private zoneUpdateSubscription: Subscription | null = null;

  constructor() {
    this.registerIcons();
    this.initializeFilters();
  }

  ngOnInit() {
    this.setupBackButtonHandler();
  }

  // ========================================
  // LIFECYCLE HOOKS
  // ========================================

  async ionViewWillEnter() {
    await this.loadZones();

    if (this.zoneUpdateSubscription) {
      this.zoneUpdateSubscription.unsubscribe();
    }

    this.zoneUpdateSubscription = this.zoneFacade.zoneStateUpdates$.subscribe(payload => {
      this.updateLocalZoneState(payload);
    });
  }

  async handleRefresh(event: any) {
    await this.loadZones();
    event.target.complete();
  }

  ngOnDestroy() {
    // Limpiar subscription del hardware back button
    if (this.backButtonSubscription) {
      this.backButtonSubscription.unsubscribe();
    }

    if (this.zoneUpdateSubscription) {
      this.zoneUpdateSubscription.unsubscribe();
    }
  }

  // ========================================
  // INICIALIZACIÓN
  // ========================================

  private initializeFilters(): void {
    this.filters = this.zoneFacade.getDefaultFilters();
    this.activeFilter = this.zoneFacade.getActiveFilterState(this.filters);
  }

  // ========================================
  // CARGA DE DATOS
  // ========================================

  private async loadZones(): Promise<void> {
    this.cargando = true;

    const result = await this.zoneFacade.loadUserZones();

    this.zonas = result.zones;
    this.cargando = false;

    // Mostrar alerta solo si hay error
    if (result.error) {
      const header = result.zones.length === 0 ? 'Aviso' : 'Error';
      await this.alertHelper.showInfo(header, result.error);
    }
  }

  /**
   * Busca la zona en el array 'this.zonas' y actualiza sus propiedades.
   */
  private updateLocalZoneState(payload: ZoneStateUpdate): void {
    if (!this.zonas || this.zonas.length === 0) return;

    const zoneIndex = this.zonas.findIndex(z => z.id === payload.zoneId);

    if (zoneIndex > -1) {
      console.log(`Actualizando UI para Zona ${payload.zoneId}`);

      // Actualizamos las propiedades de la zona en el array
      this.zonas[zoneIndex] = {
        ...this.zonas[zoneIndex], // Conservar datos existentes (id, name, branchId)
        stateZone: this.parseStateZoneFromString(payload.newState), // Necesitarás un helper
        stateLabel: payload.newStateLabel,
        iconName: payload.newIconName,
        isAvailable: payload.isAvailable
      };

      // Forzar la re-renderización si Angular no lo detecta (a veces necesario)
      // this.zonas = [...this.zonas];
    }
  }

  // ========================================
  // FILTRADO Y BÚSQUEDA
  // ========================================

  /**
   * Obtiene zonas filtradas según búsqueda y filtro activo
   */
  filteredZonas(): ZonaInventarioBranch[] {
    return this.zoneFacade.filterZones(
      this.zonas,
      this.searchTerm,
      this.activeFilter
    );
  }

  /**
   * Establece un filtro como activo
   */
  setFilter(filter: FilterState): void {
    this.filters = this.zoneFacade.activateFilter(this.filters, filter.id);
    this.activeFilter = filter.state;
  }

  /**
   * Limpia todos los filtros y búsqueda
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.filters = this.zoneFacade.resetFilters();
    this.activeFilter = null;
  }

  // ========================================
  // NAVEGACIÓN
  // ========================================

  async goBack(): Promise<void> {
    const shouldExit = await this.alertHelper.showExitConfirmation();

    if (shouldExit) {
      this.navigationService.navigateToLogin();
    }
  }

  async goToOperativo(zonaId: number, zonaName: string): Promise<void> {
    await this.navigationService.navigateToOperativo(zonaId, zonaName);
  }

  // ========================================
  // FUNCIONES DE INVITADO
  // ========================================

  /**
   * Muestra prompt para unirse como invitado
   */
  async presentJoinPrompt(): Promise<void> {
    await this.guestService.showJoinPrompt();
  }

  /**
   * Navega a scanner en modo descripción (invitado)
   */
  async scanItemDescription(): Promise<void> {
    await this.guestService.navigateToDescriptionScanner();
  }

  // ========================================
  // HELPERS PRIVADOS
  // ========================================

  private setupBackButtonHandler(): void {
    this.backButtonSubscription = this.platform.backButton.subscribeWithPriority(15, async () => {
      // Solo ejecutar si estamos en la ruta /home
      if (window.location.pathname === '/home') {
        const shouldExit = await this.alertHelper.showExitConfirmation();

        if (shouldExit) {
          this.navigationService.navigateToLogin();
        }
      }
    });
  }

  /**
   * (Este helper ya lo tenías en tu 'ZonasInventarioService',
   * lo copiamos aquí o lo movemos a un helper global)
   */
  private parseStateZoneFromString(stateString: string): StateZone {
    switch (stateString.toLowerCase()) {
      case 'available': return StateZone.Available;
      case 'ininventory': return StateZone.InInventory;
      case 'inverification': return StateZone.InVerification;
      default: return StateZone.InVerification;
    }
  }

  private registerIcons(): void {
    addIcons({
      arrowBackOutline,
      chevronDownCircleOutline,
      'close-circle-outline': closeCircleOutline,
      'lock-open-outline': lockOpenOutline,
      'lock-close-outline': lockClosedOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      'apps-outline': appsOutline,
      'person-add-outline': personAddOutline,
      'add-outline': addOutline,
      qrCodeOutline
    });
  }
}
