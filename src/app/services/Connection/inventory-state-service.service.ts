import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs/interop';
import { Observable } from 'rxjs';
import { InventoryCategory } from 'src/app/Interfaces/Connection/inventory.model';
import { FinishRequestDto } from 'src/app/Interfaces/finish-request.model';
import { ScanRequestDto } from 'src/app/Interfaces/scan-request.model';
import { ScanResponseDto } from 'src/app/Interfaces/scan-response.model';
import { StartInventoryRequestDto } from 'src/app/Interfaces/start-inventory-request.model';
import { CategoryService } from '../category.service';
import { InventoryService } from '../inventary.service';
import { SignalrService } from './signalr.service';


@Injectable({
  providedIn: 'root'
})
export class InventoryStateService {

  private signalrService = inject(SignalrService);
  private inventoryApi = inject(InventoryService);
  private categoryApi = inject(CategoryService);
  private destroyRef = inject(DestroyRef);

  // --- Estado Privado (La Fuente de Verdad) ---

  // El ID del inventario activo
  private inventaryId = signal<number | null>(null);

  // La lista completa de categorias e items (datos maestros)
  private categoriasMaestras = signal<InventoryCategory[]>([]);

  // Un Set que almacena los IDs de los items ya escaneados
  private scannedItemIds = signal<Set<number>>(new Set());

  // Estado de carga y error
  public isLoading = signal(false);
  public error = signal<string | null>(null);

  // Estado Publico (Signals Computados) ---

  /**
   * El ID del inventario activo (solo lectura).
   */
  public readonly currentInventaryId = this.inventaryId.asReadonly();

  /**
   * Signal publica.
   * Combina las categorias maestras con los IDs escaneados
   * para generar el estado de UI en tiempo real.
   */
  public readonly categoriasConEstado = computed(() => {
    const categorias = this.categoriasMaestras();
    const scannedIds = this.scannedItemIds();

    // Mapea las categorias para anadir el estado 'completado' y 'scannedCount'
    return categorias.map(categoria => {
      let scannedCount = 0;

      const itemsConEstado = categoria.items.map(item => {
        const completado = scannedIds.has(item.id);
        if (completado) {
          scannedCount++;
        }
        return { ...item, completado };
      });

      return { ...categoria, items: itemsConEstado, scannedCount };
    });
  });

  /**
   * Signal publica.
   * Expone solo la lista de IDs escaneados.
   */
  public readonly getScannedIds = this.scannedItemIds.asReadonly();


  // --- Metodos de Accion (Comandos) ---

  /**
   * Carga los datos iniciales de categorias e items para una zona.
   * Esto resetea el estado del inventario.
   */
  public async loadCategoriasPorZona(zonaId: number) {
    this.isLoading.set(true);
    this.error.set(null);
    this.resetInventoryState(); // Limpia el estado anterior

    try {
      // Se asume que categoryApi.getItemsByCategory devuelve el formato correcto
      const data = await this.categoryApi.getItemsByCategory(zonaId).toPromise();

      // Se transforman los datos maestros para anadir el estado inicial
      const categoriasIniciales: InventoryCategory[] = (data as any[]).map(cat => ({
        ...cat,
        scannedCount: 0,
        items: (cat.items as any[]).map(item => ({
          ...item,
          completado: false
        }))
      }));

      this.categoriasMaestras.set(categoriasIniciales);

    } catch (err) {
      console.error('Error cargando categorias', err);
      this.error.set('No se pudieron cargar las categorias.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Inicia un nuevo inventario.
   */
  public async startInventory(request: StartInventoryRequestDto) {
    // Se resetea el estado local primero
    this.resetInventoryState();

    const response = await this.inventoryApi.start(request).toPromise();
    if (response && response.inventaryId) {
      this.inventaryId.set(response.inventaryId);

      // Despues de iniciar, se conecta a los topics de SignalR
      this.connectToRealtimeUpdates();
    }
    return response;
  }

  /**
   * Finaliza un inventario.
   */
  public async finishInventory(request: FinishRequestDto) {
    const response = await this.inventoryApi.finish(request).toPromise();
    this.resetInventoryState(); // Limpia todo al finalizar
    return response;
  }

  /**
   * REFACTOR CLAVE:
   * Este metodo reemplaza la llamada directa en el Modal.
   * Ahora el Modal llamara a este metodo del servicio de estado.
   * Este metodo envia el scan al backend, pero NO actualiza el estado.
   * El estado solo se actualizara cuando el PUSH de SignalR regrese.
   */
  public scanItem(request: ScanRequestDto): Observable<ScanResponseDto> {
    // El servicio de estado envia la peticion
    return this.inventoryApi.scan(request);

    // NOTA: No se actualiza el estado 'scannedItemIds' aqui.
    // Se espera a que el backend confirme via SignalR.
  }

  /**
   * Resetea el estado del inventario a sus valores por defecto.
   */
  public resetInventoryState() {
    this.inventaryId.set(null);
    this.categoriasMaestras.set([]);
    this.scannedItemIds.set(new Set());
  }


  // --- 5. Logica de Tiempo Real (SignalR) ---

  /**
   * Se suscribe a los topics de SignalR para este inventario.
   */
  private connectToRealtimeUpdates() {
    console.log('[InventoryState] Conectando a topics de SignalR...');

    // Se escucha el topic "ReceiveItemUpdate"
    this.signalrService.listenToTopic<ItemScannedPayload>('ReceiveItemUpdate')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(payload => {
        console.log('[SignalR] Payload recibido:', payload);

        // El backend envia el item escaneado.
        // Se actualiza el estado local (la fuente de verdad).

        if (payload.status === 'Correct' && payload.itemId) {

          // Se actualiza el Set de IDs escaneados
          this.scannedItemIds.update(currentSet => {
            const newSet = new Set(currentSet);
            newSet.add(payload.itemId);
            return newSet;
          });

          console.log('[InventoryState] Estado actualizado por SignalR.');
        }

        // Las vistas (Pages) que esten usando el signal 'categoriasConEstado'
        // se actualizaran automaticamente gracias al 'computed signal'.
      });

    // Se pueden anadir mas listeners aqui (ej: "GroupUpdate", "InventoryFinished")
  }
}
