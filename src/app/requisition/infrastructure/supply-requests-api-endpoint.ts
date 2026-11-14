import {HttpClient} from '@angular/common/http';
import {catchError, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ErrorHandlingEnabledBaseType} from '../../shared/infrastructure/error-handling-enabled-base-type';
import {platformUrl} from '../../shared/infrastructure/platform-api';
import {sessionScopeParams} from '../../shared/infrastructure/session-scope';
import {CreateSupplyRequestRequest, PlatformSupplyRequestResource} from './supply-request-platform-response';

const supplyRequestsApiEndpointUrl = platformUrl(environment.platformProviderSupplyRequestsEndpointPath);

/**
 * Endpoint that reads and registers the supply requests of the OrganiK Platform.
 */
export class SupplyRequestsApiEndpoint extends ErrorHandlingEnabledBaseType {
  constructor(private http: HttpClient) {
    super();
  }

  getForSession = (): Observable<PlatformSupplyRequestResource[]> =>
    this.http.get<PlatformSupplyRequestResource[]>(supplyRequestsApiEndpointUrl, {params: sessionScopeParams()})
      .pipe(catchError(this.handleError('Failed to fetch supply requests')));

  create = (request: CreateSupplyRequestRequest): Observable<PlatformSupplyRequestResource> =>
    this.http.post<PlatformSupplyRequestResource>(supplyRequestsApiEndpointUrl, request)
      .pipe(catchError(this.handleError('Failed to create supply request')));
}
