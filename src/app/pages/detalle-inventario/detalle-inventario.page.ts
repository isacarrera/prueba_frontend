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
  allItems: any[] = []; // La lista COMPLETA recibida (ej: todos los Faltantes)
  displayedItems: any[] = []; // La lista PAGINADA que se muestra en pantalla


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

  /**
   * Añade el siguiente lote de ítems a la lista mostrada (llamado por el botón).
   */
  loadMore() {
    // 1. Obtener el siguiente lote usando el índice actual
    const nextBatch = this.allItems.slice(this.currentIndex, this.currentIndex + this.itemsPerBatch);
    
    // 2. Añadir el lote al array de ítems mostrados
    this.displayedItems.push(...nextBatch);
    
    // 3. Actualizar el índice para el próximo lote
    this.currentIndex += this.itemsPerBatch;
  }

  /**
   * Navega de vuelta a la página de verificación.
   */
  goBack() {
    // Esto navega de vuelta a la página principal de verificación
    this.router.navigateByUrl('/detalle-verificacion/' + this.route.snapshot.paramMap.get('inventaryId')); 
  }
}