import { Component, Input } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
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
  isProcessing = false;

  showFeedbackView = false;
  feedbackMessage = '';
  feedbackStatus: 'success' | 'error' | 'warning' | 'info' = 'info';
  private lastResponse: any = null;

  constructor(
    private modalCtrl: ModalController,
    private inventoryService: InventoryService
  ) {}

  async confirm() {
    if (this.isProcessing || !this.selectedStateId) return;

    this.isProcessing = true;

    const request = {
      inventaryId: this.inventaryId,
      code: this.code,
      stateItemId: this.selectedStateId,
    };

    try {
      const response = await this.inventoryService.scan(request).toPromise();
      this.lastResponse = response;

      if (!response) {
        throw new Error('No se recibió respuesta del servidor.');
      }

      if (response.isValid && response.itemId && response.status === 'Correct') {
        this.inventoryService.addScannedItem(response.itemId);
      }

      switch (response.status) {
        case 'Correct':
          this.feedbackMessage = 'Item escaneado correctamente.';
          this.feedbackStatus = 'success';
          break;
        case 'WrongZone':
          this.feedbackMessage = 'Item no pertenece a esta zona.';
          this.feedbackStatus = 'error';
          break;
        case 'NotFound':
          this.feedbackMessage = 'Item no encontrado en el sistema.';
          this.feedbackStatus = 'error';
          break;
        case 'Duplicate':
          this.feedbackMessage = 'Item ya escaneado anteriormente.';
          this.feedbackStatus = 'warning';
          break;
        default:
          this.feedbackMessage = 'Operación completada.';
          this.feedbackStatus = 'info';
      }

      this.showFeedbackView = true;
    } catch (err: any) {
      this.lastResponse = { error: err.message };
      this.feedbackMessage = 'No se pudo enviar el escaneo. Verifica tu conexión.';
      this.feedbackStatus = 'error';
      this.showFeedbackView = true;
    } finally {
      this.isProcessing = false;
    }
  }

  closeModalAndContinue() {
    const success = this.lastResponse && !this.lastResponse.error;
    const itemScanned =
      success && this.lastResponse.isValid && this.lastResponse.itemId;

    this.modalCtrl.dismiss({
      success: success,
      response: this.lastResponse,
      itemScanned: itemScanned,
      canContinue: true,
    });
  }

  dismiss() {
    this.modalCtrl.dismiss({
      success: false,
      dismissed: true,
      canContinue: true,
    });
  }
}