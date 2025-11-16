import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
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
  addOutline
} from 'ionicons/icons';
import { FilterState, StateZone, ZonaInventarioBranch } from 'src/app/Interfaces/zone.model';
import { NavigationService } from 'src/app/services/Common/navigation.service';
import { InventoryGuestService } from 'src/app/services/Home/inventory-guest.service';
import { ZoneFacadeService } from 'src/app/services/Home/zone-facade.service';
import { AlertHelperService } from 'src/app/services/Common/alert-helper.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class HomePage implements OnInit {

  private readonly zoneFacade = inject(ZoneFacadeService);
  private readonly guestService = inject(InventoryGuestService);
  private readonly navigationService = inject(NavigationService);
  private readonly alertHelper = inject(AlertHelperService);

  // Estado del componente
  searchTerm: string = '';
  zonas: ZonaInventarioBranch[] = [];
  cargando = true;
  filters: FilterState[] = [];
  activeFilter: StateZone | null = null;

  constructor() {
    this.registerIcons();
    this.initializeFilters();
  }

  ngOnInit() {
  }

  // ========================================
  // LIFECYCLE HOOKS
  // ========================================

  async ionViewWillEnter() {
    await this.loadZones();
  }

  async handleRefresh(event: any) {
    await this.loadZones();
    event.target.complete();
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

  goBack(): void {
    this.navigationService.navigateToLogin();
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
      'add-outline': addOutline
    });
  }
}
