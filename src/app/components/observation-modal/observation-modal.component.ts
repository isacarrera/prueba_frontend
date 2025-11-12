import { Component, Input } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-observation-modal',
  template: `
  <ion-header>
    <ion-toolbar color="dark">
      <ion-title>{{ title }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content class="ion-padding">
    <ion-item lines="none">
      <ion-label position="stacked">Observaciones</ion-label>
      <ion-textarea
        [(ngModel)]="observations"
        placeholder="Describe las observaciones..."
        rows="5"
        autoGrow="true"
        class="custom-textarea">
      </ion-textarea>
    </ion-item>
  </ion-content>

  <ion-footer>
    <ion-toolbar>
      <ion-buttons slot="end">
        <ion-button color="medium" (click)="dismiss(false)">Cancelar</ion-button>
        <ion-button color="primary" (click)="dismiss(true)">Aceptar</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-footer>
  `,
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ObservationModalComponent {
  @Input() title = 'Agregar observaciones';
  observations: string = '';

  constructor(private modalCtrl: ModalController) {}

  dismiss(confirmed: boolean) {
    this.modalCtrl.dismiss({
      confirmed,
      observations: this.observations.trim()
    });
  }
}
