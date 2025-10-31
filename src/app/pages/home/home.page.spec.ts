import { Component, OnInit } from '@angular/core';
import { IonicModule, RefresherEventDetail } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBackOutline, lockClosedOutline, lockOpenOutline } from 'ionicons/icons';
import { ZonaInventario, ZonasInventarioService } from 'src/app/services/zonas-inventario.service';
import { AuthService } from 'src/app/services/auth.service';
import { IonRefresherCustomEvent } from '@ionic/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class HomePage implements OnInit {
handleRefresh($event: IonRefresherCustomEvent<RefresherEventDetail>) {
throw new Error('Method not implemented.');
}
  searchTerm: string = '';
  zonas: ZonaInventario[] = [];
  cargando = true;

  constructor(
    private router: Router,
    private zonasService: ZonasInventarioService,
    private authService: AuthService
  ) {
    addIcons({ arrowBackOutline, lockClosedOutline, lockOpenOutline });
  }

  async ngOnInit() {
    const user = await this.authService.getUserFromToken();
    if (user?.userId) {
      this.cargarZonas(user.userId);
    }
  }

  goBack() {
    this.router.navigate(['/login']);
  }

  goToOperativo(zonaId: number) {
    this.router.navigate(['/inicio-operativo', zonaId]);
  }

  filteredZonas() {
    if (!this.searchTerm) return this.zonas;
    return this.zonas.filter((z) =>
      z.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  cargarZonas(userId: number) {
    this.zonasService.getZonas(userId).subscribe({
      next: (data) => {
        this.zonas = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar zonas', err);
        this.cargando = false;
      },
    });
  }
}
