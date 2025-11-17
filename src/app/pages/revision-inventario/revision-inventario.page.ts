import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { CheckerService } from 'src/app/services/checker.service';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  documentTextOutline,
  personOutline,
  calendarOutline,
  cubeOutline,
  informationCircleOutline,
  chevronForwardOutline,
  fileTrayOutline
} from 'ionicons/icons';
import { switchMap } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';
import { InventoryService } from 'src/app/services/inventary.service';
import { SignalrService } from 'src/app/services/Connections/signalr.service';
import { VerificationListUpdate } from 'src/app/Interfaces/verification.model';

@Component({
  selector: 'app-revision-inventario',
  templateUrl: './revision-inventario.page.html',
  styleUrls: ['./revision-inventario.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class RevisionInventarioPage implements OnInit, OnDestroy {
  inventariosEnVerificacion: any[] = [];
  branchId: number | null = null;
  cargando = true;

  private verificationListSub: Subscription | null = null;
  private signalrService: SignalrService;

  constructor(
    private router: Router,
    private authService: AuthService,
    private checkerService: CheckerService,
    private inventoryService: InventoryService,
    private injector: Injector
  ) {
    this.signalrService = this.injector.get(SignalrService);
    addIcons({
      arrowBackOutline,
      documentTextOutline,
      personOutline,
      calendarOutline,
      cubeOutline,
      informationCircleOutline,
      chevronForwardOutline,
      fileTrayOutline
    });
  }

  async ngOnInit() {

  }

  async ionViewWillEnter() {
    await this.loadInventories();
    this.subscribeToUpdates();
  }

  ionViewDidLeave() {
    if (this.verificationListSub) {
      this.verificationListSub.unsubscribe();
      this.verificationListSub = null;
    }
  }

  ngOnDestroy() {
    if (this.verificationListSub) {
      this.verificationListSub.unsubscribe();
    }
  }

  async loadInventories() {
    const user = await this.authService.getUserFromToken();
    const userId = user?.userId;

    if (!userId) {
      console.warn('No se pudo obtener userId del token');
      this.cargando = false;
      return;
    }

    this.checkerService.GetOperatingId(userId).pipe(
      switchMap(data => {
        this.branchId = data?.branchId ?? null;
        console.log('Sucursal asignada:', this.branchId);

        if (this.branchId === null) {
          return of([]);
        }

        return this.inventoryService.verificationBranch(this.branchId);
      })
    ).subscribe({
      next: (data) => {
        this.inventariosEnVerificacion = data || [];
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error en el flujo de carga de inventarios:', err);
        this.inventariosEnVerificacion = [];
        this.cargando = false;
      }
    });
  }

  /**
   * Se suscribe al Observable de SignalR.
   */
  private subscribeToUpdates(): void {
    if (this.verificationListSub) return; // Ya suscrito

    this.verificationListSub = this.signalrService.verificationListUpdates$.subscribe(payload => {
      this.handleVerificationUpdate(payload);
    });
  }

  /*
   * Actualiza la lista local 'inventariosEnVerificacion' basado en el payload.
   */
  private handleVerificationUpdate(payload: VerificationListUpdate): void {
    // Solo reaccionar si la actualización pertenece a nuestra sucursal
    if (payload.branchId !== this.branchId) {
      console.log(`Actualización ignorada (BranchId ${payload.branchId} != ${this.branchId})`);
      return;
    }

    // Si se añade un inventario
    if (payload.updateType === 'Added') {
      // Evitar duplicados (por si acaso)
      const exists = this.inventariosEnVerificacion.some(inv => inv.inventaryId === payload.inventaryId);
      if (!exists) {
        console.log(`Añadiendo inventario ${payload.inventaryId} a la lista...`);
        // Creamos el objeto que coincide con lo que espera el HTML
        const newItem = {
          inventaryId: payload.inventaryId,
          date: payload.date,
          zoneId: payload.zoneId,
          zoneName: payload.zoneName,
          // (añade cualquier otra propiedad que tu DTO 'InventarySummaryDto' tenga)
        };
        // Añadir al principio de la lista y forzar re-renderización
        this.inventariosEnVerificacion = [newItem, ...this.inventariosEnVerificacion];
      }
    }

    // Si se quita un inventario
    if (payload.updateType === 'Removed') {
      console.log(`Quitando inventario ${payload.inventaryId} de la lista...`);
      // Filtrar el inventario fuera de la lista y forzar re-renderización
      this.inventariosEnVerificacion = this.inventariosEnVerificacion.filter(
        inv => inv.inventaryId !== payload.inventaryId
      );
    }
  }

  getFormattedDate(dateString: string): string {
    if (!dateString) return 'Fecha no disponible';

    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();

      return `${day}-${month}-${year}`;
    } catch {
      return 'Fecha inválida';
    }
  }

  getFormattedTime(dateString: string): string {
    if (!dateString) return 'Hora no disponible';

    try {
      const date = new Date(dateString);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');

      return `${hours}:${minutes}`;
    } catch {
      return 'Hora inválida';
    }
  }

  goBack() {
    this.router.navigate(['/verificador']);
  }

  irADetalle(inventario: any) {
    if (inventario?.inventaryId) {
      this.router.navigate(['/detalle-verificacion', inventario.inventaryId]);
    } else {
      console.warn('Intento de navegar sin inventaryId');
    }
  }
}
