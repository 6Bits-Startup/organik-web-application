import {HttpClient, HttpParams} from '@angular/common/http';
import {catchError, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ErrorHandlingEnabledBaseType} from '../../shared/infrastructure/error-handling-enabled-base-type';
import {platformUrl} from '../../shared/infrastructure/platform-api';
import {CreateOfferedProductRequest, PlatformOfferedProductResource, UpdateOfferedProductRequest} from './supplier-platform-response';

const offeredProductsApiEndpointUrl = platformUrl(environment.platformProviderOfferedProductsEndpointPath);

/**
 * Endpoint that reads, publishes and updates the products offered by the suppliers.
 */
export class OfferedProductsApiEndpoint extends ErrorHandlingEnabledBaseType {
  constructor(private http: HttpClient) {
    super();
  }

  getBySupplierId = (supplierId: string): Observable<PlatformOfferedProductResource[]> =>
    this.http.get<PlatformOfferedProductResource[]>(offeredProductsApiEndpointUrl, {params: new HttpParams().set('supplierId', supplierId)})
      .pipe(catchError(this.handleError('Failed to fetch offered products')));

  create = (request: CreateOfferedProductRequest): Observable<PlatformOfferedProductResource> =>
    this.http.post<PlatformOfferedProductResource>(offeredProductsApiEndpointUrl, request)
      .pipe(catchError(this.handleError('Failed to publish offered product')));

  update = (offeredProductId: number, request: UpdateOfferedProductRequest): Observable<PlatformOfferedProductResource> =>
    this.http.put<PlatformOfferedProductResource>(`${offeredProductsApiEndpointUrl}/${offeredProductId}`, request)
      .pipe(catchError(this.handleError('Failed to update offered product')));
}
