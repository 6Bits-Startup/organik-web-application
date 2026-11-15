import {HttpClient, HttpParams} from '@angular/common/http';
import {catchError, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ErrorHandlingEnabledBaseType} from '../../shared/infrastructure/error-handling-enabled-base-type';
import {platformUrl} from '../../shared/infrastructure/platform-api';
import {PlatformActivityRecordResource} from './analytics-platform-response';

const activityRecordsApiEndpointUrl = platformUrl(environment.platformProviderActivityRecordsEndpointPath);

/**
 * Endpoint that reads the activity history of a minimarket.
 */
export class ActivityRecordsApiEndpoint extends ErrorHandlingEnabledBaseType {
  constructor(private http: HttpClient) {
    super();
  }

  getByMinimarketId = (minimarketId: string): Observable<PlatformActivityRecordResource[]> =>
    this.http.get<PlatformActivityRecordResource[]>(activityRecordsApiEndpointUrl, {params: new HttpParams().set('minimarketId', minimarketId)})
      .pipe(catchError(this.handleError('Failed to fetch activity records')));
}
