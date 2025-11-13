// items-page.ts (La versión NUEVA Y CORREGIDA)

import { Component, OnInit, Signal, computed, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';
import { Router, ActivatedRoute } from '@angular/router';

// 🔽 Importar el SSOT y los modelos
import { InventoryStateService } from 'src/app/services/Connection/inventory-state-service.service';
import { InventoryCategory, InventoryItem } from 'src/app/Interfaces/Connection/inventory.model'; // (Ajusta la ruta a tu modelo)

@Component({
  selector: 'app-items-page',
  templateUrl: './items-page.page.html',
  styleUrls: ['./items-page.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class ItemsPage implements OnInit {

  zonaId!: number;

  // 🔽 Inyectar dependencias
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private inventoryStateService = inject(InventoryStateService);

  // --- [PROPIEDADES REACTIVAS] ---
  public categoria!: Signal<InventoryCategory | undefined>;
  public items!: Signal<InventoryItem[]>;
  // -------------------------------

  constructor() {
    addIcons({ arrowBackOutline });
  }

  ngOnInit() {
    // Obtener IDs de la URL (ruta V2)
    this.zonaId = Number(this.route.snapshot.paramMap.get('zonaId'));
    const idCategoria = Number(this.route.snapshot.paramMap.get('idCategoria'));

    // 1. Obtener el Signal de la categoría desde el SSOT
    this.categoria = this.inventoryStateService.getCategoryStateById(idCategoria);

    // 2. Crear un Signal computado para los items
    this.items = computed(() => {
      return this.categoria()?.items ?? [];
    });
  }

  goBack() {
    this.router.navigate(['/inicio-operativo', this.zonaId]);
  }
}
