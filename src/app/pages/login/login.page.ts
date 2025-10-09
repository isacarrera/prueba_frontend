import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class LoginPage {

  constructor(private router: Router) {}

  goToOperativo() {
  this.router.navigate(['/operativo']);
}

goToVerificador() {
  this.router.navigate(['/verificador']);
}

}
