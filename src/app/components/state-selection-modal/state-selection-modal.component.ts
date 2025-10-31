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
  isProcessing = false; // ✅ NUEVO: Evitar múltiples clics

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private inventoryService: InventoryService
  ) {}

  async confirm() {
    // ✅ NUEVO: Prevenir múltiples ejecuciones
    if (this.isProcessing || !this.selectedStateId) return;
    
    this.isProcessing = true; // ✅ NUEVO

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

      // ✅ IMPORTANTE: Marcar el item como escaneado si fue exitoso
      if (response.isValid && response.itemId && response.status === 'Correct') {
        this.inventoryService.addScannedItem(response.itemId);
        console.log('✅ Item marcado como escaneado:', response.itemId);
      }

      // ✅ Manejo según status
      let feedbackMessage = '';
      switch (response.status) {
        case 'Correct':
          feedbackMessage = '✅ Item escaneado correctamente.';
          break;
        case 'WrongZone':
          feedbackMessage = '❌ Item no pertenece a esta zona.';
          break;
        case 'NotFound':
          feedbackMessage = '🔍 Item no encontrado en el sistema.';
          break;
        case 'Duplicate':
          feedbackMessage = '⚠️ Item ya escaneado anteriormente.';
          break;
        default:
          feedbackMessage = 'ℹ️ Operación completada.';
      }

      // Mostrar feedback
      const alert = await this.alertCtrl.create({
        header: 'Resultado',
        message: feedbackMessage,
        buttons: [{
          text: 'OK',
          handler: () => {
            // ✅ MODIFICADO: Cerrar modal con canContinue: true
            this.modalCtrl.dismiss({ 
              success: true, 
              response,
              itemScanned: response.isValid && response.itemId,
              canContinue: true // ✅ CRÍTICO: Esto permite que el scanner continúe
            });
          }
        }],
      });
      
      await alert.present();

    } catch (err: any) {
      console.error('Error en escaneo:', err);
      
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: '❌ No se pudo enviar el escaneo. Verifica tu conexión.',
        buttons: [{
          text: 'OK',
          handler: () => {
            // ✅ MODIFICADO: Cerrar modal con canContinue: true incluso en error
            this.modalCtrl.dismiss({ 
              success: false, 
              error: err.message,
              canContinue: true // ✅ CRÍTICO: Esto permite que el scanner continúe
            });
          }
        }],
      });
      await alert.present();
    } finally {
      this.isProcessing = false; // ✅ NUEVO
    }
  }

  // ✅ MODIFICADO: dismiss corregido
  dismiss() {
    this.modalCtrl.dismiss({ 
      success: false, 
      dismissed: true,
      canContinue: true // ✅ CRÍTICO: Esto permite que el scanner continúe
    });
  }
}