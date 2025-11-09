import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { InventoryService } from 'src/app/services/inventary.service';
import { StateSelectionModalComponent } from '../state-selection-modal/state-selection-modal.component';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  qrCodeOutline,
  checkmarkOutline,
  checkmarkDoneOutline,
  warningOutline,
  informationCircleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  readerOutline,
  arrowBackOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.page.html',
  styleUrls: ['./scanner.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class ScannerPage implements OnInit, OnDestroy {
  scannedCode: string | null = null;
  showInstructions = true;
  scanMode: 'inventory' | 'description' = 'inventory';
  zonaId: number = 0;

  isDescriptionModalOpen = false;
  descriptionCode: string | null = null;
  descriptionMessage: string | null = null;

  constructor(
    private router: Router,
    private inventoryService: InventoryService,
    private alertController: AlertController,
    private modalController: ModalController,
    private route: ActivatedRoute
  ) {
    // 👇 2. Registra los íconos aquí
    addIcons({
      closeOutline,
      checkmarkOutline,
      checkmarkDoneOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      warningOutline,
      informationCircleOutline
    });

    try {
      const navigation = this.router.getCurrentNavigation();
      if (navigation?.extras?.state) {
        this.scanMode = navigation.extras.state['scanMode'] || 'inventory';
      }
    } catch (e) {
      this.scanMode = 'inventory';
    }
  }

  async ngOnInit() {
    this.zonaId = Number(this.route.snapshot.paramMap.get('zonaId'));

    if (this.scanMode === 'inventory') {
      const inventaryId = this.inventoryService.getInventaryId();
      if (!inventaryId) {
        await this.showError('No hay un inventario activo.');
        this.router.navigate(['/inicio-operativo', this.zonaId]);
        return;
      }
    }

    const permission = await BarcodeScanner.checkPermission({ force: true });
    if (!permission.granted) {
      await this.showError('Permiso de cámara requerido para escanear.');
      this.router.navigate(['/inicio-operativo', this.zonaId]);
      return;
    }

    document.body.classList.add('scanner-active');
    document.querySelector('html')?.classList.add('scanner-active');
    await BarcodeScanner.hideBackground();

    this.startScanning();
    setTimeout(() => (this.showInstructions = false), 2000);
  }

  ngOnDestroy() {
    this.stopScanner();
  }

  private async startScanning() {
    try {
      const result = await BarcodeScanner.startScan();
      if (result.hasContent) {
        const cleanCode = result.content.replace(/^Code:/, '');

        await this.handleScanResult(cleanCode);

        if (this.scanMode === 'inventory') {
          this.startScanning();
        }
      }
    } catch (err) {
      console.error('Error en escaneo:', err);
      this.stopScanner();
    }
  }

  private async handleScanResult(cleanCode: string) {
    if (this.scanMode === 'description') {
      await BarcodeScanner.stopScan();

      this.descriptionCode = cleanCode;
      this.descriptionMessage =
        'Aquí se mostraría la descripción del ítem escaneado.';
      this.isDescriptionModalOpen = true;
    } else {
      this.scannedCode = cleanCode;
      await new Promise((r) => setTimeout(r, 800));
      this.scannedCode = null;
      await this.openStateSelectionModal(cleanCode);
    }
  }

  closeDescriptionModal() {
    this.isDescriptionModalOpen = false;
    this.router.navigate(['/inicio-operativo', this.zonaId]);
  }

  private async openStateSelectionModal(code: string) {
    const modal = await this.modalController.create({
      component: StateSelectionModalComponent,
      componentProps: {
        code,
        inventaryId: this.inventoryService.getInventaryId()!,
      },
    });

    await modal.present();
    await modal.onDidDismiss();
  }

  private async showError(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  async cancelScan() {
    await this.stopScanner();
    this.router.navigate([
      '/inicio-operativo/',
      this.route.snapshot.paramMap.get('zonaId'),
    ]);
  }

  private async stopScanner() {
    try {
      await BarcodeScanner.stopScan();
    } catch (e) {
      console.warn('StopScan falló', e);
    }

    await BarcodeScanner.showBackground();
    document.body.classList.remove('scanner-active');
    document.querySelector('html')?.classList.remove('scanner-active');
  }

  async toggleFlash() {
    const alert = await this.alertController.create({
      header: 'Flash',
      message: 'Este dispositivo no soporta flash para escaneo.',
      buttons: ['OK'],
    });
    await alert.present();
  }
}