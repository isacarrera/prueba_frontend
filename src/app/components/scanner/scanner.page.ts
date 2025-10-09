import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { InventoryService } from 'src/app/services/inventary.service';
import { StateSelectionModalComponent } from '../state-selection-modal/state-selection-modal.component';

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
  constructor(
    private router: Router,
    private inventoryService: InventoryService,
    private alertController: AlertController,
    private modalController: ModalController,
    private route: ActivatedRoute
  ) {}
  
  async ngOnInit() {
    const zonaId = Number(this.route.snapshot.paramMap.get('zonaId'));  
    const inventaryId = this.inventoryService.getInventaryId();
    if (!inventaryId) {
      await this.showError('No hay un inventario activo.');
      this.router.navigate(['/inicio-operativo']);
      return;
    }

    const permission = await BarcodeScanner.checkPermission({ force: true });
    if (!permission.granted) {
      await this.showError('Permiso de cámara requerido para escanear.');
      this.router.navigate(['/inicio-operativo', zonaId]);
      return;
    }

    // 🔑 Activa cámara y fondo transparente
    document.body.classList.add('scanner-active');
    document.querySelector('html')?.classList.add('scanner-active');
    await BarcodeScanner.hideBackground();

    // Inicia escaneo
    this.startScanning();
     setTimeout(() => this.showInstructions = false, 2000);
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

        // Reanudar escaneo después de procesar
        this.startScanning();
      }
    } catch (err) {
      console.error('Error en escaneo:', err);
      this.stopScanner();
    }
  }

  private async handleScanResult(cleanCode: string) {
    this.scannedCode = cleanCode;
    await new Promise((r) => setTimeout(r, 800));
      this.scannedCode = null;
    await this.openStateSelectionModal(cleanCode);
    
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
    this.router.navigate(['/inicio-operativo/', this.route.snapshot.paramMap.get('zonaId')]);
  }

  private async stopScanner() {
    await BarcodeScanner.stopScan();
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