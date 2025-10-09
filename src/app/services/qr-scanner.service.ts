import { Injectable } from '@angular/core';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

@Injectable({
  providedIn: 'root'
})
export class QrScannerService {

  async startScan(): Promise<string | null> {
    // Solicita permiso
    const status = await BarcodeScanner.checkPermission({ force: true });
    if (!status.granted) {
      throw new Error('Permiso de cámara denegado');
    }

    // Activa la vista de cámara en el fondo
    document.body.classList.add('scanner-container');

    try {
      const result = await BarcodeScanner.startScan();
      if (result.hasContent) {
        return result.content;
      }
      return null;
    } finally {
      // Siempre limpia
      document.body.classList.remove('scanner-container');
      await BarcodeScanner.stopScan();
    }
  }

  async stopScan() {
    document.body.classList.remove('scanner-container');
    await BarcodeScanner.stopScan();
  }
}