import {HttpClient} from '@angular/common/http';
import {catchError, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ErrorHandlingEnabledBaseType} from '../../shared/infrastructure/error-handling-enabled-base-type';
import {platformUrl} from '../../shared/infrastructure/platform-api';
import {CreateSupplierRequest, PlatformSupplierResource} from './supplier-platform-response';

const suppliersApiEndpointUrl = platformUrl(environment.platformProviderSuppliersEndpointPath);

/**
 * Endpoint that reads and registers the suppliers of the OrganiK Platform.
 */
export class SuppliersApiEndpoint extends ErrorHandlingEnabledBaseType {
  constructor(private http: HttpClient) {
    super();
  }

  getAll = (): Observable<PlatformSupplierResource[]> =>
    this.http.get<PlatformSupplierResource[]>(suppliersApiEndpointUrl).pipe(catchError(this.handleError('Failed to fetch suppliers')));

  create = (request: CreateSupplierRequest): Observable<PlatformSupplierResource> =>
    this.http.post<PlatformSupplierResource>(suppliersApiEndpointUrl, request).pipe(catchError(this.handleError('Failed to create supplier')));
}
