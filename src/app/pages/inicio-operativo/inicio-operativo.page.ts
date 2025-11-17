import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, Platform } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  checkmarkDoneOutline,
  checkmarkOutline,
  closeOutline,
  cloudUploadOutline,
  documentTextOutline,
  homeOutline,
  informationCircleOutline,
  logOutOutline,
  personAddOutline,
  qrCodeOutline,
  readerOutline
} from 'ionicons/icons';
import { AlertHelperService } from 'src/app/services/Common/alert-helper.service';
import { NavigationService } from 'src/app/services/Common/navigation.service';
import { CategoryFacadeService } from 'src/app/services/Inicio-Operativo/category-facade.service';
import { InventoryExitService } from 'src/app/services/Inicio-Operativo/inventory-exit.service';
import { InventoryFacadeService } from 'src/app/services/Inicio-Operativo/inventory-facade.service';

@Component({
  selector: 'app-inicio-operativo',
  templateUrl: './inicio-operativo.page.html',
  styleUrls: ['./inicio-operativo.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class InicioOperativoPage implements OnInit, OnDestroy {

  private readonly route = inject(ActivatedRoute);
  private readonly inventoryFacade = inject(InventoryFacadeService);
  private readonly categoryFacade = inject(CategoryFacadeService);
  private readonly navigationService = inject(NavigationService);
  private readonly alertHelper = inject(AlertHelperService);
  private readonly inventoryExitService = inject(InventoryExitService);
  private readonly platform = inject(Platform);

  // Estado del componente
  categorias: any[] = [];
  cargando = true;
  operatingGroupId: number | null = null;
  invitationCode: string | null = null;
  observacionTexto: string = '';

  // Estados de modales
  isInviteOpen = false;
  isExportOpen = false;
  isInstructionsOpen = false;
  isConfirmOpen = false;

  // Subscription del hardware back button
  private backButtonSubscription: any;

  // Getter para código de invitación
  get codeArray(): string[] {
    return this.invitationCode ? this.invitationCode.split('') : ['-', '-', '-', '-'];
  }

  constructor() {
    this.registerIcons();
  }

  async ngOnInit() {
    await this.loadInitialData();
    this.setupBackButtonHandler();
  }

  ngOnDestroy() {
    if (this.backButtonSubscription) {
      this.backButtonSubscription.unsubscribe();
    }
  }

  async ionViewCanLeave(): Promise<boolean> {
    const shouldExit = await this.inventoryExitService.handleExitAttempt();

    if (shouldExit) {
      this.navigationService.navigateToLogin();
      return false;
    }

    return false;
  }

  // ========================================
  // INICIALIZACIÓN
  // ========================================

  private async loadInitialData(): Promise<void> {
    const zonaId = this.getZonaIdFromRoute();

    // Cargar categorías
    this.loadCategories(zonaId);

    // Obtener operating group ID
    this.operatingGroupId = await this.inventoryFacade.getOperatingGroupId();
  }

  private loadCategories(zonaId: number): void {
    this.categoryFacade.getCategoriesByZone(zonaId).subscribe({
      next: (result) => {
        this.categorias = result.data;
        this.cargando = result.loading;

        if (result.error) {
          this.alertHelper.showError(result.error);
        }
      }
    });
  }

  // ========================================
  // NAVEGACIÓN
  // ========================================

  goToItem(categoria: any): void {
    const zonaId = this.route.snapshot.paramMap.get('zonaId');
    this.navigationService.navigateToItem(categoria.id, zonaId, categoria);
  }

  async scanItemDescription(): Promise<void> {
    await this.navigationService.navigateToScannerDescription();
  }

  // ========================================
  // INICIAR INVENTARIO
  // ========================================

  async iniciarInventario(): Promise<void> {
    const zonaId = this.getZonaIdFromRoute();

    if (!this.operatingGroupId) {
      await this.alertHelper.showError('No se pudo obtener el grupo operativo.');
      return;
    }

    // Si ya hay inventario activo, ir directo al scanner
    if (this.inventoryFacade.hasActiveInventory()) {
      this.navigationService.navigateToScanner(zonaId, false);
      return;
    }

    // Confirmar inicio
    await this.alertHelper.showConfirmation(
      'Iniciar inventario',
      '¿Estás seguro de iniciar el inventario en esta zona?',
      async () => await this.executeStartInventory(zonaId),
      'Iniciar'
    );
  }

  private async executeStartInventory(zonaId: number): Promise<void> {
    const result = await this.inventoryFacade.startInventory(
      zonaId,
      this.operatingGroupId!
    );

    if (result.success) {
      this.invitationCode = result.invitationCode ?? null;
      this.navigationService.navigateToScanner(zonaId, false);
    } else {
      await this.alertHelper.showError(result.error || 'No se pudo iniciar el inventario.');
    }
  }

  // ========================================
  // FINALIZAR INVENTARIO
  // ========================================

  async finalizarInventario(): Promise<void> {

    this.closeConfirmModal();

    const scannedCount = this.inventoryFacade.getScannedItemCount();
    if (scannedCount === 0) {
      await this.alertHelper.showError(
        'No se puede finalizar un inventario sin ítems escaneados.'
      );
      return;
    }

    const observationResult = await this.alertHelper.showObservationPrompt(
      'Finalizar inventario',
      'Agrega observaciones si lo deseas (opcional):'
    );

    if (observationResult === null) {
      return;
    }

    this.observacionTexto = observationResult;

    await this.executeFinishInventory();
  }

  private async executeFinishInventory(): Promise<void> {
    const result = await this.inventoryFacade.finishInventory(this.observacionTexto);

    if (result.success) {
      this.observacionTexto = '';

      await this.alertHelper.showInfoWithCallback(
        '✅ Éxito',
        'Inventario finalizado correctamente.',
        () => this.navigationService.navigateToLogin()
      );
    } else {
      await this.alertHelper.showError(result.error || 'No se pudo finalizar el inventario.');
    }
  }

  // ========================================
  // MANEJO DE SALIDA
  // ========================================

  async onExitButtonPress(): Promise<void> {
    // Llama al servicio central
    const shouldExit = await this.inventoryExitService.handleExitAttempt();

    // Si el servicio confirma (usuario presionó "Salir" o "Salir y Cancelar")
    if (shouldExit) {
      // Navega a login (consistente con tu back button handler)
      this.navigationService.navigateToLogin();
    }
  }

  // ========================================
  // GESTIÓN DE MODALES (UI PURA)
  // ========================================

  openInviteModal(): void {
    this.isInviteOpen = true;
  }

  closeInviteModal(): void {
    this.isInviteOpen = false;
  }

  openInstructionsModal(): void {
    this.isInstructionsOpen = true;
  }

  closeInstructionsModal(): void {
    this.isInstructionsOpen = false;
  }

  openExportModal(): void {
    this.isExportOpen = true;
  }

  closeExportModal(): void {
    this.isExportOpen = false;
  }

  openConfirmModal(): void {
    this.isConfirmOpen = true;
  }

  closeConfirmModal(): void {
    this.isConfirmOpen = false;
  }

  // ========================================
  // HELPERS PRIVADOS
  // ========================================

  private getZonaIdFromRoute(): number {
    return Number(this.route.snapshot.paramMap.get('zonaId'));
  }

  private setupBackButtonHandler(): void {
    this.backButtonSubscription = this.platform.backButton.subscribeWithPriority(15, async () => {
      // Verificar que estamos en la ruta de inicio-operativo
      const currentPath = window.location.pathname;
      const isInicioOperativo = currentPath.includes('/inicio-operativo/');

      if (isInicioOperativo) {
        const shouldExit = await this.inventoryExitService.handleExitAttempt();

        if (shouldExit) {
          this.navigationService.navigateToLogin();
        }
      }
    });
  }

  private registerIcons(): void {
    addIcons({
      cloudUploadOutline,
      checkmarkDoneOutline,
      documentTextOutline,
      homeOutline,
      qrCodeOutline,
      informationCircleOutline,
      personAddOutline,
      arrowBackOutline,
      checkmarkOutline,
      readerOutline,
      logOutOutline,
      closeOutline,
    });
  }
}
