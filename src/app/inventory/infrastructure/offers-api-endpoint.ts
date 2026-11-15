import {HttpClient, HttpParams} from '@angular/common/http';
import {catchError, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ErrorHandlingEnabledBaseType} from '../../shared/infrastructure/error-handling-enabled-base-type';
import {platformUrl} from '../../shared/infrastructure/platform-api';
import {CreateOfferRequest, PlatformOfferResource} from './inventory-platform-response';

const offersApiEndpointUrl = platformUrl(environment.platformProviderOffersEndpointPath);

/**
 * Endpoint that reads and registers the offers of a stock lot.
 */
export class OffersApiEndpoint extends ErrorHandlingEnabledBaseType {
  constructor(private http: HttpClient) {
    super();
  }

  getByStockLotId = (stockLotId: number): Observable<PlatformOfferResource[]> =>
    this.http.get<PlatformOfferResource[]>(offersApiEndpointUrl, {params: new HttpParams().set('stockLotId', stockLotId)})
      .pipe(catchError(this.handleError('Failed to fetch offers')));

  create = (request: CreateOfferRequest): Observable<PlatformOfferResource> =>
    this.http.post<PlatformOfferResource>(offersApiEndpointUrl, request)
      .pipe(catchError(this.handleError('Failed to register offer')));
}
