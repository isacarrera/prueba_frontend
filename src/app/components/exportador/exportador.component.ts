import { Component, Input } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-exportador',
  templateUrl: './exportador.component.html',
  styleUrls: ['./exportador.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class ExportadorComponent {

  @Input() data: any[] = [];
  @Input() fileName: string = 'reporte';

  // 🔹 Función para transformar valores
 private formatValue(value: any): string {
  if (Array.isArray(value)) {
    // Si es un array de objetos → mostramos SOLO el "name" o "nombre" (+ cantidad si existe)
    return value.map(v => {
      if (typeof v === 'object' && v !== null) {
        if ('name' in v && 'cantidad' in v) {
          return `${v.name} (${v.cantidad})`;
        }
        if ('name' in v) {
          return v.name;
        }
        if ('nombre' in v) {
          return v.nombre;
        }
        return JSON.stringify(v); // fallback
      }
      return v;
    }).join(', ');
  }

  if (typeof value === 'object' && value !== null) {
    // Si es objeto simple → lo convierto a JSON corto
    if ('name' in value) return value.name;
    if ('nombre' in value) return value.nombre;
    return JSON.stringify(value);
  }

  return String(value ?? '');
}

  // 📄 Exportar a PDF
  exportToPDF() {
    const doc = new jsPDF();
    doc.text(this.fileName.toUpperCase(), 14, 10);

    if (this.data.length > 0) {
      autoTable(doc, {
        startY: 20,
        head: [Object.keys(this.data[0])],
        body: this.data.map(item =>
          Object.keys(item).map(key => this.formatValue(item[key]))
        )
      });
    } else {
      doc.text('No hay datos para exportar', 14, 30);
    }

    doc.save(`${this.fileName}.pdf`);
  }

  // 📊 Exportar a Excel
  exportToExcel() {
    if (this.data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Convertimos data → valores legibles
    const formattedData = this.data.map(item => {
      const row: any = {};
      Object.keys(item).forEach(key => {
        row[key] = this.formatValue(item[key]);
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = { Sheets: { 'Datos': worksheet }, SheetNames: ['Datos'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `${this.fileName}.xlsx`);
  }

  // 📝 Exportar a Word
  exportToWord() {
    if (this.data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    let content = `
      <h2>${this.fileName.toUpperCase()}</h2>
      <table border="1" style="border-collapse: collapse; width: 100%">
        <tr>${Object.keys(this.data[0]).map(k => `<th>${k}</th>`).join('')}</tr>
        ${this.data.map(item =>
          `<tr>${Object.keys(item).map(key => `<td>${this.formatValue(item[key])}</td>`).join('')}</tr>`
        ).join('')}
      </table>
    `;

    const blob = new Blob(
      ['\ufeff', content],
      { type: 'application/msword' }
    );
    saveAs(blob, `${this.fileName}.doc`);
  }
}
