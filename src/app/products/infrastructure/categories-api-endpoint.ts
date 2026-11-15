import {HttpClient} from '@angular/common/http';
import {catchError, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ErrorHandlingEnabledBaseType} from '../../shared/infrastructure/error-handling-enabled-base-type';
import {platformUrl} from '../../shared/infrastructure/platform-api';
import {PlatformCategoryResource} from './product-platform-response';

const categoriesApiEndpointUrl = platformUrl(environment.platformProviderCategoriesEndpointPath);

/**
 * Endpoint that reads the product categories of the OrganiK Platform.
 */
export class CategoriesApiEndpoint extends ErrorHandlingEnabledBaseType {
  constructor(private http: HttpClient) {
    super();
  }

  getAll = (): Observable<PlatformCategoryResource[]> =>
    this.http.get<PlatformCategoryResource[]>(categoriesApiEndpointUrl).pipe(catchError(this.handleError('Failed to fetch categories')));
}
