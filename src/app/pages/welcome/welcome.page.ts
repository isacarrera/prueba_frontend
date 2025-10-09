import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController } from '@ionic/angular';
import { IonContent } from "@ionic/angular/standalone";

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent],
})
export class WelcomePage implements OnInit, OnDestroy {
  currentScreen = 0;
  timer: any;

  welcomeScreens = [
    { logo: 'assets/images/Logo3.png', background: 'assets/images/Frame_Test.png' },
    { logo: 'assets/images/Logo2.png', background: 'assets/images/Frame_Test.png' },
    { logo: 'assets/images/Logo3.png', background: 'assets/images/Frame_Test.png' },
    { logo: 'assets/images/Logo.png', background: 'assets/images/Rectangle_Gradient.png' },
  ];

  constructor(private navCtrl: NavController) {}

  ngOnInit() {
    this.startSequence();
  }

  startSequence() {
    this.timer = setInterval(() => {
      if (this.currentScreen < this.welcomeScreens.length - 1) {
        this.currentScreen++;
      } else {
        clearInterval(this.timer);
        setTimeout(() => {
          this.navCtrl.navigateRoot('/login');
        }, 600);
      }
    }, 900); 
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}