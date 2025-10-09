import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent],
})
export class WelcomePage implements OnInit, OnDestroy {
  showWelcome = false;
  timer: any;

  background = 'assets/images/Frame_Test.png';
  logo = 'assets/images/Logo.png'; 

  constructor(private navCtrl: NavController) {}

  ngOnInit() {
    this.timer = setTimeout(() => {
      this.showWelcome = true;   
      setTimeout(() => {
        this.navCtrl.navigateRoot('/login');
      }, 1500);
    }, 1200);
  }

  ngOnDestroy() {
    if (this.timer) clearTimeout(this.timer);
  }
}
