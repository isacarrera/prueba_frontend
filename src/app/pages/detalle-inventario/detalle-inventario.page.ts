import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-detalle-inventario',
  templateUrl: './detalle-inventario.page.html',
  styleUrls: ['./detalle-inventario.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class DetalleInventarioPage implements OnInit {

  title: string = 'Detalle de Ítems';
  allItems: any[] = [];
  displayedItems: any[] = [];
  inventaryId!: number;

  private itemsPerBatch = 20;
  private currentIndex = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state) {
      this.title = nav.extras.state['title'];
      this.allItems = nav.extras.state['allItems'];
      this.inventaryId = nav.extras.state['inventaryId'];
    }
    this.loadInitialBatch();
  }

  /**
   * Carga los primeros itemsPerBatch al inicio.
   */
  loadInitialBatch() {
    this.displayedItems = this.allItems.slice(0, this.itemsPerBatch);
    this.currentIndex = this.itemsPerBatch;
  }


  loadMore() {

    const nextBatch = this.allItems.slice(this.currentIndex, this.currentIndex + this.itemsPerBatch);

    this.displayedItems.push(...nextBatch);

    this.currentIndex += this.itemsPerBatch;

  }

  goBack() {
    this.router.navigateByUrl('/detalle-verificacion/' + this.inventaryId);
  }

  getPageClass(): string {
    if (this.title.includes('Faltantes')) {
      return 'theme-missing';
    }
    if (this.title.includes('Inesperados')) {
      return 'theme-unexpected';
    }
    if (this.title.includes('Discrepancias')) {
      return 'theme-mismatch';
    }
    return 'theme-default';
  }
}
