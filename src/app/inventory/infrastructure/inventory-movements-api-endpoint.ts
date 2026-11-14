import {HttpClient, HttpParams} from '@angular/common/http';
import {catchError, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ErrorHandlingEnabledBaseType} from '../../shared/infrastructure/error-handling-enabled-base-type';
import {platformUrl} from '../../shared/infrastructure/platform-api';
import {PlatformInventoryMovementResource, RegisterInventoryMovementRequest} from './inventory-platform-response';

const inventoryMovementsApiEndpointUrl = platformUrl(environment.platformProviderInventoryMovementsEndpointPath);

/**
 * Endpoint that reads and registers the movements of a stock lot.
 */
export class InventoryMovementsApiEndpoint extends ErrorHandlingEnabledBaseType {
  constructor(private http: HttpClient) {
    super();
  }

  getByStockLotId = (stockLotId: number): Observable<PlatformInventoryMovementResource[]> =>
    this.http.get<PlatformInventoryMovementResource[]>(inventoryMovementsApiEndpointUrl, {params: new HttpParams().set('stockLotId', stockLotId)})
      .pipe(catchError(this.handleError('Failed to fetch inventory movements')));

  register = (request: RegisterInventoryMovementRequest): Observable<PlatformInventoryMovementResource> =>
    this.http.post<PlatformInventoryMovementResource>(inventoryMovementsApiEndpointUrl, request)
      .pipe(catchError(this.handleError('Failed to register inventory movement')));
}
