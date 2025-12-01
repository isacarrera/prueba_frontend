import { Component, OnInit } from '@angular/core';
import {
  IonicModule,
  IonContent,
  IonButton,
  IonIcon,
  IonLabel,
  IonSpinner,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  timeOutline,
  searchOutline,
  closeCircleOutline,
  checkmarkCircleOutline,
  timeOutline as timeIcon,
  refreshOutline
} from 'ionicons/icons';
import { Router, ActivatedRoute } from '@angular/router';
import { InventoryService } from 'src/app/services/inventary.service';

// Interface para los filtros
interface FilterState {
  id: string;
  name: string;
  icon: string;
  active: boolean;
  type: 'all' | 'scanned' | 'unscanned';
}

@Component({
  selector: 'app-inicio-mouse',
  templateUrl: './inicio-mouse.page.html',
  styleUrls: ['./inicio-mouse.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule
  ],
})
export class InicioMousePage implements OnInit {
  categoria: any;
  items: any[] = [];
  cargando = true;
  zonaId!: number;

  filteredItems: any[] = [];
  displayedItems: any[] = [];

  // Variables de filtro actualizadas
  filters: FilterState[] = [];
  activeFilterType: 'all' | 'scanned' | 'unscanned' = 'all';
  searchTerm: string = '';

  private itemsPerBatch = 15;
  private currentIndex = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private inventoryService: InventoryService
  ) {
    addIcons({
      arrowBackOutline,
      timeOutline,
      searchOutline,
      closeCircleOutline,
      checkmarkCircleOutline,
      timeIcon,
      refreshOutline
    });
  }

  ngOnInit() {
    this.zonaId = Number(this.route.snapshot.paramMap.get('zonaId'));

    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state && nav.extras.state['categoria']) {
      this.categoria = nav.extras.state['categoria'];
      this.items = this.categoria.items;
    }

    this.initializeFilters();
    this.applyFilter();
    this.cargando = false;
  }

  // ========================================
  // INICIALIZACIÓN DE FILTROS
  // ========================================

  private initializeFilters(): void {
    this.filters = [
      {
        id: 'all',
        name: 'Todos',
        icon: 'apps-outline',
        active: true,
        type: 'all'
      },
      {
        id: 'scanned',
        name: 'Escaneados',
        icon: 'checkmark-circle-outline',
        active: false,
        type: 'scanned'
      },
      {
        id: 'unscanned',
        name: 'Pendientes',
        icon: 'time-outline',
        active: false,
        type: 'unscanned'
      }
    ];
  }

  // ========================================
  // MANEJO DE FILTROS
  // ========================================

  setFilter(filter: FilterState): void {
    // Desactivar todos los filtros primero
    this.filters.forEach(f => f.active = false);

    // Activar el filtro seleccionado
    filter.active = true;
    this.activeFilterType = filter.type;

    this.applyFilter();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filters.forEach(f => f.active = f.id === 'all');
    this.activeFilterType = 'all';
    this.applyFilter();
  }

  applyFilter(): void {
    // Aplicar filtro por tipo
    switch (this.activeFilterType) {
      case 'scanned':
        this.filteredItems = this.items.filter(item => this.isScanned(item));
        break;
      case 'unscanned':
        this.filteredItems = this.items.filter(item => !this.isScanned(item));
        break;
      default:
        this.filteredItems = [...this.items];
    }

    // Aplicar filtro de búsqueda si existe
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      this.filteredItems = this.filteredItems.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.code.toLowerCase().includes(term)
      );
    }

    // Reiniciar paginación
    this.currentIndex = 0;
    this.loadInitialBatch();
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.detail.value || '';
    this.applyFilter();
  }

  // ========================================
  // PAGINACIÓN
  // ========================================

  loadInitialBatch(): void {
    this.displayedItems = this.filteredItems.slice(0, this.itemsPerBatch);
    this.currentIndex = this.itemsPerBatch;
  }

  loadMore(): void {
    const nextBatch = this.filteredItems.slice(this.currentIndex, this.currentIndex + this.itemsPerBatch);
    this.displayedItems.push(...nextBatch);
    this.currentIndex += this.itemsPerBatch;
  }

  // ========================================
  // REFRESH
  // ========================================

  async handleRefresh(event: any): Promise<void> {
    // Simular recarga de datos
    setTimeout(() => {
      this.applyFilter(); // Re-aplicar filtros
      event.target.complete();
    }, 1000);
  }

  // ========================================
  // HELPERS
  // ========================================

  get filteredCount(): number {
    return this.filteredItems.length;
  }

  get hasActiveFilters(): boolean {
    return this.activeFilterType !== 'all' || this.searchTerm.trim() !== '';
  }

  isScanned(item: any): boolean {
    return this.inventoryService.isItemScanned(item.id);
  }

  goBack(): void {
    this.router.navigate(['/inicio-operativo', this.zonaId]);
  }
}
