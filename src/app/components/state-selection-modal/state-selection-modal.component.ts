import { Component, Input } from '@angular/core';
import { ModalController, AlertController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { STATE_ITEMS, StateItem } from 'src/app/Interfaces/state-item.model';
import { InventoryService } from 'src/app/services/inventary.service';

@Component({
  selector: 'app-state-selection-modal',
  templateUrl: './state-selection-modal.component.html',
  styleUrls: ['./state-selection-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class StateSelectionModalComponent {
  @Input() code!: string;
  @Input() inventaryId!: number;

  selectedStateId: number | null = null;
  stateItems: StateItem[] = STATE_ITEMS;

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private inventoryService: InventoryService
  ) {}

  async confirm() {
    if (!this.selectedStateId) return;

    const request = {
      inventaryId: this.inventaryId,
      code: this.code,
      stateItemId: this.selectedStateId,
    };

    try {
      const response = await this.inventoryService.scan(request).toPromise();

      // ✅ Validación explícita
      if (!response) {
        throw new Error('No se recibió respuesta del servidor.');
      }

      // ✅ Manejo según status
      let feedbackMessage = '';
      switch (response.status) {
        case 'Correct':
          feedbackMessage = '✅ Item escaneado correctamente.';
          break;
        case 'WrongZone':
          feedbackMessage = '⚠️ Item no pertenece a esta zona.';
          break;
        case 'NotFound':
          feedbackMessage = '❌ Item no encontrado en el sistema.';
          break;
        case 'Duplicate':
          feedbackMessage = '🔁 Item ya escaneado anteriormente.';
          break;
        default:
          feedbackMessage = 'ℹ️ Operación completada.';
      }

      // Mostrar feedback
      const alert = await this.alertCtrl.create({
        header: 'Resultado',
        message: feedbackMessage,
        buttons: ['OK'],
      });
      await alert.present(); // ✅ Solo una vez

      // Cerrar modal con resultado
      await this.modalCtrl.dismiss({ success: true, response });
    } catch (err) {
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'No se pudo enviar el escaneo. Verifica tu conexión.',
        buttons: ['OK'],
      });
      await alert.present(); // ✅ Solo una vez
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}