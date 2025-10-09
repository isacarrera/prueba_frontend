import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { CheckerService } from 'src/app/services/checker.service';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';
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
    addIcons({ arrowBackOutline });
  }

  async ngOnInit() {
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

        // Llamamos a verificationBranch con branchId
        return this.inventoryService.verificationBranch(this.branchId);
      })
    ).subscribe({
      next: (data) => {
        this.inventariosEnVerificacion = data; // ya es un array
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error en el flujo de carga de inventarios:', err);
        this.cargando = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/verificador-operativo']);
  }

  irADetalle(inventario: any) {
  // Asegúrate de que inventaryId exista
  if (inventario?.inventaryId) {
    this.router.navigate(['/detalle-verificacion', inventario.inventaryId]);
  } else {
    console.warn('Intento de navegar sin inventaryId');
  }
}
}