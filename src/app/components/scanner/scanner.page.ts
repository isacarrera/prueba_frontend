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
import { AuthService } from 'src/app/services/auth.service';
import { InventoryService } from 'src/app/services/inventary.service';
import { Item, ItemService } from 'src/app/services/item.service';
import { ZonasInventarioService } from 'src/app/services/zonas-inventario.service';
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
  scanMode: 'inventory' | 'description' = 'inventory';
  zonaId: number = 0;      // Se usa para inventario
  branchId: number = 0;    // Se usa para descripción

  // Modal de descripción
  isDescriptionModalOpen = false;
  descriptionItem: Item | null = null;
  descriptionError: string | null = null;

  /** Almacena si el usuario entró como Invitado (true) o Anfitrión (false) */
  private isGuestFlow: boolean = false;

  constructor(
    private router: Router,
    private inventoryService: InventoryService,
    private alertController: AlertController,
    private modalController: ModalController,
    private route: ActivatedRoute,
    private itemService: ItemService,
    private zonasService: ZonasInventarioService,
    private authService: AuthService
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
        // Leer el nuevo flag. Si no viene, se asume que es Anfitrion (false).
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

    // Permiso de camara
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
      // Los invitados siempre vuelven a /home
      this.router.navigate(['/home']);
    } else {
      // Los anfitriones siempre vuelven a la zona específica
      // Leemos el ID de la ruta actual para asegurar que siempre lo tenemos
      const currentZoneId = this.route.snapshot.paramMap.get('zonaId');
      this.router.navigate(['/inicio-operativo', currentZoneId]);
    }
  }

  ngOnDestroy() {
    this.stopScanner();
  }

  // Inicia el escaneo
  private async startScanning() {
    try {
      const result = await BarcodeScanner.startScan();

      if (result.hasContent) {
        const cleanCode = result.content.replace(/^Code:/, '');
        await this.handleScanResult(cleanCode);

        if (this.scanMode === 'inventory') {
          this.startScanning(); // vuelve a escanear automáticamente
        }
      }
    } catch (err) {
      console.error('[ScannerPage] Error en startScan() / Plugin falló:', err);
      this.stopScanner();
    }
  }

  // Maneja el resultado del escaneo
  private async handleScanResult(cleanCode: string) {
    if (this.scanMode === 'description') {
      await BarcodeScanner.stopScan();

      try {
        const item = await this.itemService
          .getByCodeAndBranch(this.branchId, cleanCode)
          .toPromise();

        if (item) {
          this.descriptionItem = item;
          this.descriptionError = null;
        } else {
          this.descriptionItem = null;
          this.descriptionError = `No se encontró ningún ítem con código ${cleanCode}.`;
        }
      } catch (error) {
        console.error('Error al obtener el ítem:', error);
        this.descriptionItem = null;
        this.descriptionError = 'Error al obtener la descripción del ítem.';
      }

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
    this.navigateOnExit();
  }

  // Modal de seleccion de estado (modo inventario)
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

  // Mensaje de error reutilizable
  private async showError(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  // Cancela el escaneo y vuelve a inicio-operativo (solo inventario)
  async cancelScan() {
    await this.stopScanner();
    this.navigateOnExit();
  }

  // Detiene y limpia el estado del escáner
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

  // Control del flash
  async toggleFlash() {
    const alert = await this.alertController.create({
      header: 'Flash',
      message: 'Este dispositivo no soporta flash para escaneo.',
      buttons: ['OK'],
    });
    await alert.present();
  }
}
