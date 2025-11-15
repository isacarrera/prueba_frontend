import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { CategoryService } from '../category.service';

/**
 * Facade para gestión de categorías
 * Encapsula lógica de carga y manejo de errores
 */
@Injectable({
  providedIn: 'root'
})
export class CategoryFacadeService {
  private readonly categoryService = inject(CategoryService);

  /**
   * Obtiene categorías por zona con manejo de estados
   */
  getCategoriesByZone(zoneId: number): Observable<{
    data: any[];
    loading: boolean;
    error: string | null;
  }> {
    return this.categoryService.getItemsByCategory(zoneId).pipe(
      map((data) => ({
        data,
        loading: false,
        error: null
      })),
      catchError((err) => {
        console.error('Error cargando categorías:', err);
        return of({
          data: [],
          loading: false,
          error: 'No se pudieron cargar las categorías'
        });
      })
    );
  }

  /**
   * Calcula el total esperado de items sumando contadores
   */
  calculateTotalExpected(categories: any[]): number {
    return categories.reduce((sum, cat) => sum + (cat.contador || 0), 0);
  }
}
