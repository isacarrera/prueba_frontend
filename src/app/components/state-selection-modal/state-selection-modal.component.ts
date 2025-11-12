import { Component, Input, OnInit } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from 'src/app/services/inventary.service';
import { StateItem } from 'src/app/Interfaces/state-item.model';
import { firstValueFrom } from 'rxjs';
import { StateItemService } from 'src/app/services/stateItem.service';

@Component({
  selector: 'app-state-selection-modal',
  templateUrl: './state-selection-modal.component.html',
  styleUrls: ['./state-selection-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class StateSelectionModalComponent implements OnInit {
  @Input() code!: string;
  @Input() inventaryId!: number;

  selectedStateId: number | null = null;
  stateItems: StateItem[] = [];
  isProcessing = false;

  showFeedbackView = false;
  feedbackMessage = '';
  feedbackStatus: 'success' | 'error' | 'warning' | 'info' = 'info';
  private lastResponse: any = null;

  constructor(
    private modalCtrl: ModalController,
    private inventoryService : InventoryService,
    private stateItemService : StateItemService
  ) {}

  async ngOnInit() {
    await this.loadStateItems();
  }

  /** 🔹 Carga los estados reales desde la API */
  private async loadStateItems() {
    try {
      this.stateItems = await firstValueFrom(this.stateItemService.getStateItems());
      if (!this.stateItems.length) {
        console.warn('⚠️ No se encontraron estados en el backend.');
      }
    } catch (err) {
      console.error('❌ Error al cargar estados de ítem:', err);
      this.stateItems = [];
    }
  }

  async confirm() {
    if (this.isProcessing || !this.selectedStateId) return;

    this.isProcessing = true;

    const request = {
      inventaryId: this.inventaryId,
      code: this.code,
      stateItemId: this.selectedStateId,
    };

    try {
      const response = await firstValueFrom(this.inventoryService.scan(request));
      this.lastResponse = response;

      if (!response) throw new Error('No se recibió respuesta del servidor.');

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
      success,
      response: this.lastResponse,
      itemScanned,
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
