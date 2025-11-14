import { Component, OnInit } from '@angular/core'; 
import { IonicModule } from '@ionic/angular'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { arrowBackOutline, timeOutline } from 'ionicons/icons';
import { Router, ActivatedRoute } from '@angular/router';
import { InventoryService } from 'src/app/services/inventary.service';

@Component({
  selector: 'app-inicio-mouse',
  templateUrl: './inicio-mouse.page.html',
  styleUrls: ['./inicio-mouse.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class InicioMousePage implements OnInit {
  categoria: any;
  items: any[] = []; // Esta es tu lista COMPLETA
  cargando = true;
  zonaId!: number;

  displayedItems: any[] = []; 
  
  private itemsPerBatch = 15; // Cuántos cargar cada vez
  private currentIndex = 0;

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private inventoryService: InventoryService
  ) {
    addIcons({ arrowBackOutline, timeOutline });
  }

  ngOnInit() {
    this.zonaId = Number(this.route.snapshot.paramMap.get('zonaId'));

    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state && nav.extras.state['categoria']) {
      this.categoria = nav.extras.state['categoria'];
      this.items = this.categoria.items;
    }

    this.loadInitialBatch();
    this.cargando = false;
  }

  loadInitialBatch() {
    this.displayedItems = this.items.slice(0, this.itemsPerBatch);
    this.currentIndex = this.itemsPerBatch;
  }

  loadMore() {
    const nextBatch = this.items.slice(this.currentIndex, this.currentIndex + this.itemsPerBatch);
    
    this.displayedItems.push(...nextBatch);
    
    this.currentIndex += this.itemsPerBatch;
    
  }
  
  isScanned(item: any): boolean {
    return this.inventoryService.isItemScanned(item.id);
  }
  
  goBack() {
    this.router.navigate(['/inicio-operativo', this.zonaId]);
  }
}