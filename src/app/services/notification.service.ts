// src/app/services/item.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { InventoryNotificationRequest } from '../Interfaces/inventory-notification.model';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private baseUrl = environment.apiURL + 'api';

    constructor(private http: HttpClient) { }

    async sendInventoryNotification(payload: InventoryNotificationRequest): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/Notification/InventoryRequest`, payload)
    );
  }


}