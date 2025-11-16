import { Component, Input, OnInit } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItemData } from 'src/app/Interfaces/item-info.model';

@Component({
  selector: 'app-item-info-modal',
  templateUrl: './item-info-modal.component.html',
  styleUrls: ['./item-info-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class ItemInfoModalComponent  {
  @Input() itemData!: ItemData;

  constructor(private modalCtrl: ModalController) { }


  getStatusClass(status: string | undefined): string {
    if (!status) return 'status-unknown';

    // Mapeo específico para tus 4 estados exactos
    const statusMap: { [key: string]: string } = {
      'en orden': 'status-ok',
      'reparación': 'status-repair',
      'dañado': 'status-damaged',
      'perdido': 'status-lost'
    };

    const normalizedStatus = status.toLowerCase().trim();
    return statusMap[normalizedStatus] || 'status-unknown';
  }

  getStatusDisplayName(status: string | undefined): string {
    if (!status) return 'Desconocido';

    const normalizedStatus = status.toLowerCase().trim();

    // Convertir a nombre de display consistente
    const displayMap: { [key: string]: string } = {
      'en orden': 'En Orden',
      'reparación': 'Reparación',
      'dañado': 'Dañado',
      'perdido': 'Perdido'
    };

    return displayMap[normalizedStatus] || status;
  }

  editItem() {
    // Emitir evento de edición
    this.modalCtrl.dismiss({
      action: 'edit',
      itemData: this.itemData
    });
  }

  dismiss() {
    this.modalCtrl.dismiss({
      action: 'close',
      itemData: this.itemData
    });
  }
}
