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

  @Input() alreadyScanned: boolean = false;

  selectedStateId: number | null = null;
  stateItems: StateItem[] = [];
  isProcessing = false;

  showFeedbackView = false;
  feedbackMessage = '';
  feedbackStatus: 'success' | 'error' | 'warning' | 'info' = 'info';
  private lastResponse: any = null;

  constructor(
    private modalCtrl: ModalController,
    private inventoryService: InventoryService,
    private stateItemService: StateItemService
  ) {}

  async ngOnInit() {
    await this.loadStateItems();

    // Si ya estaba escaneado, mostrar feedback de inmediato
    if (this.alreadyScanned) {
      this.showFeedbackView = true;
      this.feedbackMessage = 'Este ítem ya fue escaneado anteriormente.';
      this.feedbackStatus = 'warning';
    }
  }

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

    if (this.alreadyScanned) {
      return;
    }

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

      // Registrar como escaneado (solo si NO es duplicado)
      if (response.itemId) {
        this.inventoryService.addScannedItem(response.itemId);  
      }

      // UI feedback por estado devuelto
      switch (response.status) {
        case 'Correct':
          this.feedbackMessage = 'Ítem escaneado correctamente.';
          this.feedbackStatus = 'success';
          break;
        case 'WrongZone':
          this.feedbackMessage = 'Ítem no pertenece a esta zona.';
          this.feedbackStatus = 'error';
          break;
        case 'NotFound':
          this.feedbackMessage = 'Ítem no encontrado en el sistema.';
          this.feedbackStatus = 'error';
          break;
        case 'Duplicate':
          this.feedbackMessage = 'Ítem ya escaneado anteriormente.';
          this.feedbackStatus = 'warning';
          break;
        default:
          this.feedbackMessage = 'Operación completada.';
          this.feedbackStatus = 'info';
      }

      this.showFeedbackView = true;

    } catch (err: any) {

      let backendMessage = 'No se pudo enviar el escaneo. Verifica tu conexión.';

      if (err?.error?.message) backendMessage = err.error.message;
      else if (err?.error?.error) backendMessage = err.error.error;
      else if (typeof err === 'string') backendMessage = err;

      this.lastResponse = { error: backendMessage };
      this.feedbackMessage = backendMessage;
      this.feedbackStatus = 'error';
      this.showFeedbackView = true;

    } finally {
      this.isProcessing = false;
    }
  }

  closeModalAndContinue() {
    const success = this.lastResponse && !this.lastResponse.error;
    const itemScanned = !!(this.lastResponse && this.lastResponse.itemId);

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
