import {HttpClient} from '@angular/common/http';
import {catchError, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ErrorHandlingEnabledBaseType} from '../../shared/infrastructure/error-handling-enabled-base-type';
import {platformUrl} from '../../shared/infrastructure/platform-api';
import {CreateProductRequest, PlatformProductResource, UpdateProductRequest} from './product-platform-response';

const productsApiEndpointUrl = platformUrl(environment.platformProviderProductsEndpointPath);

/**
 * Endpoint that reads and writes the products of the OrganiK Platform.
 */
export class ProductsApiEndpoint extends ErrorHandlingEnabledBaseType {
  constructor(private http: HttpClient) {
    super();
  }

  getAll = (): Observable<PlatformProductResource[]> =>
    this.http.get<PlatformProductResource[]>(productsApiEndpointUrl).pipe(catchError(this.handleError('Failed to fetch products')));

  create = (request: CreateProductRequest): Observable<PlatformProductResource> =>
    this.http.post<PlatformProductResource>(productsApiEndpointUrl, request).pipe(catchError(this.handleError('Failed to create product')));

  update = (productId: number, request: UpdateProductRequest): Observable<PlatformProductResource> =>
    this.http.put<PlatformProductResource>(`${productsApiEndpointUrl}/${productId}`, request)
      .pipe(catchError(this.handleError('Failed to update product')));
}
