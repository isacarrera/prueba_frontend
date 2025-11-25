import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { AlertController, IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  checkmarkDoneOutline,
  checkmarkOutline,
  closeCircleOutline,
  closeOutline,
  informationCircleOutline,
  qrCodeOutline,
  warningOutline
} from 'ionicons/icons';
import { InventoryService } from 'src/app/services/inventary.service';
import { Item, ItemService } from 'src/app/services/item.service';
import { StateSelectionModalComponent } from '../state-selection-modal/state-selection-modal.component';
import { ItemInfoModalComponent } from '../item-info-modal/item-info-modal.component';
import { ItemData } from 'src/app/Interfaces/item-info.model';
import { firstValueFrom } from 'rxjs';

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
  branchId: number = 0;

  isDescriptionModalOpen = false;
  descriptionItem: Item | null = null;
  descriptionError: string | null = null;

  private isGuestFlow: boolean = false;

  constructor(
    private router: Router,
    private inventoryService: InventoryService,
    private alertController: AlertController,
    private modalController: ModalController,
    private route: ActivatedRoute,
    private itemService: ItemService,
  ) {
    addIcons({
      closeOutline,
      checkmarkOutline,
      checkmarkDoneOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      warningOutline,
      informationCircleOutline,
      'qr-code-outline': qrCodeOutline
    });

    try {
      const navigation = this.router.getCurrentNavigation();
      if (navigation?.extras?.state) {
        this.scanMode = navigation.extras.state['scanMode'] || 'inventory';
        this.isGuestFlow = navigation.extras.state['isGuest'] || false;
      }
    } catch {
      this.scanMode = 'inventory';
      this.isGuestFlow = false;
    }
  }

  async ngOnInit() {
    const paramId = Number(this.route.snapshot.paramMap.get('zonaId'));

    if (this.scanMode === 'inventory') {
      this.zonaId = paramId;
      const inventaryId = this.inventoryService.getInventaryId();

      if (!inventaryId) {
        await this.showError('No hay un inventario activo.');
        this.navigateOnExit();
        return;
      }
    }

    if (this.scanMode === 'description') {
      this.branchId = paramId;
    }

    const permission = await BarcodeScanner.checkPermission({ force: true });

    if (!permission.granted) {
      await this.showError('Permiso de cámara requerido para escanear.');
      this.navigateOnExit();
      return;
    }

    document.body.classList.add('scanner-active');
    document.querySelector('html')?.classList.add('scanner-active');
    await BarcodeScanner.hideBackground();

    this.startScanning();
    setTimeout(() => (this.showInstructions = false), 2000);
  }

  private navigateOnExit() {
    if (this.isGuestFlow) {
      this.router.navigate(['/home']);
    } else {
      const currentZoneId = this.route.snapshot.paramMap.get('zonaId');
      this.router.navigate(['/inicio-operativo', currentZoneId]);
    }
  }

  ngOnDestroy() {
    this.stopScanner();
  }

  private async startScanning() {
    try {
      const result = await BarcodeScanner.startScan();

      if (result.hasContent) {
        await this.handleScanResult(result.content);

        if (this.scanMode === 'inventory' || this.scanMode === 'description') {
          this.startScanning();
        }
      }
    } catch (err) {
      console.error('[ScannerPage] Error en startScan():', err);
      this.stopScanner();
    }
  }

  private async handleScanResult(rawCode: string) {

    const cleanRaw = rawCode.trim().replace(/\s+/g, '');
    const QR_REGEX = /^Code:[A-Za-z0-9]{1,12}$/;

    if (!QR_REGEX.test(cleanRaw)) {
      await this.showError('Código QR inválido. Solo se aceptan QRs del sistema.');

      if (this.scanMode === 'inventory') this.startScanning();
      return;
    }

    const code = cleanRaw.replace('Code:', '');

    // -----------------------------------------
    // DESCRIPCIÓN
    // -----------------------------------------
    if (this.scanMode === 'description') {
      await BarcodeScanner.stopScan();

      try {
        const item = await this.itemService
          .getByCodeAndBranch(this.branchId, code)
          .toPromise();

        if (item) {
          await this.presentItemInfoModal(item as ItemData);
        } else {
          await this.showError(`No se encontró ningún ítem con código ${code}.`);
          await new Promise(r => setTimeout(r, 1500));
        }

      } catch (error) {
        console.error('Error al obtener el ítem:', error);
        await this.showError('Error al obtener la descripción del ítem.');
        await new Promise(r => setTimeout(r, 1500));
      }

      return;
    }

    // -----------------------------------------
    // INVENTARIO
    // -----------------------------------------
    this.scannedCode = code;
    await new Promise((r) => setTimeout(r, 800));
    this.scannedCode = null;

    const inventaryId = this.inventoryService.getInventaryId()!;

    try {
      const res = await firstValueFrom(
        this.inventoryService.isItemScannedByCode(inventaryId, code)
      );

      if (res.isScanned) {
        // Abrir modal en modo duplicado
        await this.openStateSelectionModal(code, true);
        return;
      }
    } catch (err: any) {
      if (err.status === 404) {
        await this.showError(err.error?.message || "Item no encontrado.");
        return;
      }
    }

    // Si NO es duplicado → abrir modal normal
    await this.openStateSelectionModal(code);
  }

  closeDescriptionModal() {
    this.navigateOnExit();
  }

  private async openStateSelectionModal(code: string, alreadyScanned = false) {
    const modal = await this.modalController.create({
      component: StateSelectionModalComponent,
      componentProps: {
        code,
        inventaryId: this.inventoryService.getInventaryId()!,
        alreadyScanned
      },
    });

    await modal.present();
    await modal.onDidDismiss();
  }

  private async presentItemInfoModal(itemData: ItemData) {
    const modal = await this.modalController.create({
      component: ItemInfoModalComponent,
      componentProps: {
        itemData: itemData
      },
      cssClass: 'item-info-modal'
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
    this.navigateOnExit();
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
