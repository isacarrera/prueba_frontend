import { Component, OnInit } from '@angular/core';
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
import { of } from 'rxjs';
import { InventoryService } from 'src/app/services/inventary.service';

@Component({
  selector: 'app-revision-inventario',
  templateUrl: './revision-inventario.page.html',
  styleUrls: ['./revision-inventario.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class RevisionInventarioPage implements OnInit {
  inventariosEnVerificacion: any[] = [];
  branchId: number | null = null;
  cargando = true;

  constructor(
    private router: Router,
    private authService: AuthService,
    private checkerService: CheckerService,
    private inventoryService: InventoryService
  ) {
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
    await this.loadInventories();
  }

  async ionViewWillEnter() {
    await this.loadInventories();
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

  getFormattedDateTime(dateString: string): string {
    if (!dateString) return 'Fecha/hora no disponible';

    try {
      const date = this.getFormattedDate(dateString);
      const time = this.getFormattedTime(dateString);

      return `${date} ${time}`;
    } catch {
      return 'Fecha/hora inválida';
    }
  }

  // Métodos auxiliares para la vista
  getCardStatusClass(inventario: any): string {
    return inventario?.stateZone?.toLowerCase() || 'pending';
  }

  getStatusIcon(inventario: any): string {
    const status = inventario?.stateZone?.toLowerCase();
    switch(status) {
      case 'completed': return 'checkmark-done-outline';
      case 'in-progress': return 'sync-outline';
      default: return 'time-outline';
    }
  }

  getStatusText(inventario: any): string {
    const status = inventario?.stateZone?.toLowerCase();
    switch(status) {
      case 'completed': return 'Completado';
      case 'in-progress': return 'En Progreso';
      default: return 'Pendiente';
    }
  }

  calculateProgress(inventario: any): number {
    // Implementa tu lógica de cálculo de progreso aquí
    // Por ejemplo, basado en items verificados vs totales
    if (inventario?.verifiedItems && inventario?.totalItems) {
      return Math.round((inventario.verifiedItems / inventario.totalItems) * 100);
    }
    return inventario?.progress || 0;
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
