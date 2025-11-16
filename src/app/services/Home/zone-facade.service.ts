import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { ZonasInventarioService } from '../zonas-inventario.service';
import { AuthService } from '../auth.service';
import { FilterState, StateZone, ZonaInventarioBranch } from 'src/app/Interfaces/zone.model';

/**
 * Facade para gestión completa de zonas operativas
 * Centraliza: carga, filtrado, búsqueda y validaciones
 */
@Injectable({
  providedIn: 'root'
})
export class ZoneFacadeService {
  private readonly zonasService = inject(ZonasInventarioService);
  private readonly authService = inject(AuthService);

  // 🔹 Filtros predefinidos del sistema
  private readonly DEFAULT_FILTERS: FilterState[] = [
    { id: 1, name: 'Todos', state: null, icon: 'apps-outline', active: true },
    { id: 2, name: 'Disponible', state: StateZone.Available, icon: 'lock-open-outline', active: false },
    { id: 3, name: 'En Inventario', state: StateZone.InInventory, icon: 'lock-close-outline', active: false },
    { id: 4, name: 'En Verificación', state: StateZone.InVerification, icon: 'shield-checkmark-outline', active: false }
  ];

  /**
   * Obtiene los filtros por defecto
   */
  getDefaultFilters(): FilterState[] {
    return JSON.parse(JSON.stringify(this.DEFAULT_FILTERS)); // Deep copy
  }

  /**
   * Carga zonas del usuario autenticado
   */
  async loadUserZones(): Promise<{
    zones: ZonaInventarioBranch[];
    error: string | null;
  }> {
    try {
      const user = await this.authService.getUserFromToken();

      if (!user?.userId) {
        return {
          zones: [],
          error: 'Usuario no autenticado'
        };
      }

      const zones = await this.zonasService.getZonas(user.userId).toPromise();

      return {
        zones: zones || [],
        error: zones?.length === 0 ? 'No tienes inventarios asignados en este momento.' : null
      };
    } catch (err: any) {
      console.error('Error al cargar zonas', err);

      let errorMessage = 'Ocurrió un problema al cargar las zonas.';
      if (err.status === 404) {
        errorMessage = 'No tienes inventarios asignados en este momento.';
      }

      return {
        zones: [],
        error: errorMessage
      };
    }
  }

  /**
   * Filtra zonas por búsqueda de texto y estado
   */
  filterZones(
    zones: ZonaInventarioBranch[],
    searchTerm: string,
    activeFilter: StateZone | null
  ): ZonaInventarioBranch[] {
    let filtered = [...zones];

    // Filtro de búsqueda por nombre
    if (searchTerm?.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(z =>
        z.name.toLowerCase().includes(term)
      );
    }

    // Filtro por estado
    if (activeFilter !== null) {
      filtered = filtered.filter(z => z.stateZone === activeFilter);
    }

    return filtered;
  }

  /**
   * Activa un filtro específico
   */
  activateFilter(filters: FilterState[], filterId: number): FilterState[] {
    return filters.map(f => ({
      ...f,
      active: f.id === filterId
    }));
  }

  /**
   * Resetea filtros al estado inicial (Todos)
   */
  resetFilters(): FilterState[] {
    return this.getDefaultFilters();
  }

  /**
   * Obtiene el filtro activo actual
   */
  getActiveFilterState(filters: FilterState[]): StateZone | null {
    const active = filters.find(f => f.active);
    return active?.state ?? null;
  }

  /**
   * Valida si una zona está disponible para entrar
   */
  isZoneAccessible(zone: ZonaInventarioBranch): boolean {
    return zone.isAvailable === true;
  }

  /**
   * Obtiene el primer branchId disponible (para navegación)
   */
  async getFirstBranchId(): Promise<number | null> {
    try {
      const user = await this.authService.getUserFromToken();
      if (!user?.userId) return null;

      const zones = await this.zonasService.getZonas(user.userId).toPromise();
      return zones?.[0]?.branchId ?? null;
    } catch {
      return null;
    }
  }
}
