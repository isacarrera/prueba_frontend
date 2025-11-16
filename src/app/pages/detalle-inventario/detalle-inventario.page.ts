import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-detalle-inventario',
  templateUrl: './detalle-inventario.page.html',
  styleUrls: ['./detalle-inventario.page.scss'],
  standalone: true,
  // Asegúrate de que los módulos necesarios estén importados si es standalone
  imports: [IonicModule, CommonModule]
})
export class DetalleInventarioPage implements OnInit {

  // --- Propiedades de Recepción y Visualización ---
  title: string = 'Detalle de Ítems';
  allItems: any[] = [];
  displayedItems: any[] = [];
  inventaryId!: number;


  // --- Propiedades de Paginación ---
  private itemsPerBatch = 20; // Cantidad de ítems a cargar por cada clic
  private currentIndex = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute // Necesario si usas navegación relativa o simple goBack
  ) { }

  ngOnInit() {
    // 1. Recibir los datos pasados por NavigationExtras (el array completo)
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state) {
      this.title = nav.extras.state['title'];
      this.allItems = nav.extras.state['allItems'];
      this.inventaryId = nav.extras.state['inventaryId'];
    }
    // 2. Cargar el primer lote para llenar la pantalla inicial
    this.loadInitialBatch();
  }

  // =====================================================
  // Lógica de Paginación
  // =====================================================

  /**
   * Carga los primeros itemsPerBatch al inicio.
   */
  loadInitialBatch() {
    // Corta el array completo para obtener el primer lote
    this.displayedItems = this.allItems.slice(0, this.itemsPerBatch);
    // Actualiza el índice al final del primer lote
    this.currentIndex = this.itemsPerBatch;
  }


  loadMore() {

    const nextBatch = this.allItems.slice(this.currentIndex, this.currentIndex + this.itemsPerBatch);

    this.displayedItems.push(...nextBatch);

    this.currentIndex += this.itemsPerBatch;

  }

  goBack() {
    // Esto navega de vuelta a la página principal de verificación
    this.router.navigateByUrl('/detalle-verificacion/' + this.inventaryId);
  }

  getPageClass(): string {
    if (this.title.includes('Faltantes')) {
      return 'theme-missing'; // Amarillo
    }
    if (this.title.includes('Inesperados')) {
      return 'theme-unexpected'; // Azul/Púrpura
    }
    if (this.title.includes('Discrepancias')) {
      return 'theme-mismatch'; // Otro color (ej. terciario)
    }
    return 'theme-default';
  }
}