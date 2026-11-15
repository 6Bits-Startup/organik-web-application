import {HttpClient, HttpParams} from '@angular/common/http';
import {catchError, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ErrorHandlingEnabledBaseType} from '../../shared/infrastructure/error-handling-enabled-base-type';
import {platformUrl} from '../../shared/infrastructure/platform-api';
import {PlatformOperationalIndicatorsResource} from './analytics-platform-response';

const operationalIndicatorsApiEndpointUrl = platformUrl(environment.platformProviderOperationalIndicatorsEndpointPath);

/**
 * Endpoint that reads the operational indicators of a minimarket.
 */
export class OperationalIndicatorsApiEndpoint extends ErrorHandlingEnabledBaseType {
  constructor(private http: HttpClient) {
    super();
  }

  getByMinimarketId = (minimarketId: string): Observable<PlatformOperationalIndicatorsResource> =>
    this.http.get<PlatformOperationalIndicatorsResource>(operationalIndicatorsApiEndpointUrl, {params: new HttpParams().set('minimarketId', minimarketId)})
      .pipe(catchError(this.handleError('Failed to fetch operational indicators')));
}
