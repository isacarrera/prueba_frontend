import { Component, Input } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule, NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface UnscannedItem {
  id: number;
  code: string;
  name: string;
  description: string;
  currentState: string;
  selectedState?: string;
}

@Component({
  selector: 'app-unscanned-items-modal',
  templateUrl: './unscanned-items-modal.component.html',
  styleUrls: ['./unscanned-items-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class UnscannedItemsModalComponent {
  @Input() unscannedItems: UnscannedItem[] = [];

  // Variables de paginación
  displayedItems: UnscannedItem[] = [];
  private itemsPerBatch = 5;
  private currentIndex = 0;
  hasMoreItems = false;

  constructor(private modalCtrl: ModalController) { }

  ngOnInit() {
    // Inicializar todos los estados como "perdido" por defecto
    this.unscannedItems.forEach(item => {
      if (!item.selectedState) {
        item.selectedState = 'perdido';
      }
    });

    this.loadInitialBatch();
  }

  onStateChange(item: UnscannedItem, newState: string) {
    item.selectedState = newState;
  }

  // Métodos de paginación - AGREGAR ESTOS
  loadInitialBatch() {
    this.displayedItems = this.unscannedItems.slice(0, this.itemsPerBatch);
    this.currentIndex = this.itemsPerBatch;
    this.updateHasMoreItems();
  }

  loadMore() {
    const nextBatch = this.unscannedItems.slice(
      this.currentIndex,
      this.currentIndex + this.itemsPerBatch
    );

    this.displayedItems.push(...nextBatch);
    this.currentIndex += this.itemsPerBatch;
    this.updateHasMoreItems();
  }

  private updateHasMoreItems() {
    this.hasMoreItems = this.currentIndex < this.unscannedItems.length;
  }

  getStateBadgeClass(state: string): string {
    const stateMap: { [key: string]: string } = {
      'en orden': 'state-ok',
      'reparación': 'state-repair',
      'dañado': 'state-damaged',
      'perdido': 'state-lost'
    };
    return stateMap[state] || 'state-unknown';
  }

  getStateDisplayName(state: string): string {
    const displayMap: { [key: string]: string } = {
      'en orden': 'En Orden',
      'reparación': 'Reparación',
      'dañado': 'Dañado',
      'perdido': 'Perdido'
    };
    return displayMap[state] || state;
  }

  applyChanges() {
    const updatedItems = this.unscannedItems.map(item => ({
      id: item.id,
      code: item.code,
      finalState: item.selectedState
    }));

    this.modalCtrl.dismiss({
      action: 'apply',
      updatedItems: updatedItems
    });
  }

  dismiss() {
    this.modalCtrl.dismiss({
      action: 'cancel'
    });
  }
}
