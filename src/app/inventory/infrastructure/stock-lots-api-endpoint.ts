import {HttpClient, HttpParams} from '@angular/common/http';
import {catchError, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ErrorHandlingEnabledBaseType} from '../../shared/infrastructure/error-handling-enabled-base-type';
import {platformUrl} from '../../shared/infrastructure/platform-api';
import {CreateStockLotRequest, PlatformStockLotResource} from './inventory-platform-response';

const stockLotsApiEndpointUrl = platformUrl(environment.platformProviderStockLotsEndpointPath);

/**
 * Endpoint that reads and registers the stock lots of a minimarket.
 */
export class StockLotsApiEndpoint extends ErrorHandlingEnabledBaseType {
  constructor(private http: HttpClient) {
    super();
  }

  getByMinimarketId = (minimarketId: string): Observable<PlatformStockLotResource[]> =>
    this.http.get<PlatformStockLotResource[]>(stockLotsApiEndpointUrl, {params: new HttpParams().set('minimarketId', minimarketId)})
      .pipe(catchError(this.handleError('Failed to fetch stock lots')));

  getById = (stockLotId: number): Observable<PlatformStockLotResource> =>
    this.http.get<PlatformStockLotResource>(`${stockLotsApiEndpointUrl}/${stockLotId}`)
      .pipe(catchError(this.handleError('Failed to fetch stock lot')));

  create = (request: CreateStockLotRequest): Observable<PlatformStockLotResource> =>
    this.http.post<PlatformStockLotResource>(stockLotsApiEndpointUrl, request)
      .pipe(catchError(this.handleError('Failed to register stock lot')));
}
