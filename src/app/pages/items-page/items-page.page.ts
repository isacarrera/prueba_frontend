import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-items-page',
  templateUrl: './items-page.page.html',
  styleUrls: ['./items-page.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class ItemsPage implements OnInit {

  categoria: any;
  items: any[] = [];
  zonaId!: number;

  constructor(private router: Router, private route: ActivatedRoute) {
    addIcons({ arrowBackOutline });
  }

  ngOnInit() {

    this.zonaId = Number(this.route.snapshot.paramMap.get('zonaId'));
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state && nav.extras.state['categoria']) {
      this.categoria = nav.extras.state['categoria'];
      this.items = this.categoria.items;
        this.items = this.categoria.items.map((item: any) => ({
      ...item,
      completado: false 
    }));
    }
  }

  goBack() {
    this.router.navigate(['/inicio-operativo', this.zonaId]);
  }

  toggleItem(item: any, checked: boolean) {
    item.completado = checked;
  }
}
