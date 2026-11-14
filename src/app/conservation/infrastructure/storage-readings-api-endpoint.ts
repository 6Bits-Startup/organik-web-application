import {HttpClient, HttpParams} from '@angular/common/http';
import {catchError, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ErrorHandlingEnabledBaseType} from '../../shared/infrastructure/error-handling-enabled-base-type';
import {platformUrl} from '../../shared/infrastructure/platform-api';
import {PlatformStorageReadingResource} from './conservation-platform-response';

const storageReadingsApiEndpointUrl = platformUrl(environment.platformProviderStorageReadingsEndpointPath);

/**
 * Endpoint that reads the readings of a storage zone.
 */
export class StorageReadingsApiEndpoint extends ErrorHandlingEnabledBaseType {
  constructor(private http: HttpClient) {
    super();
  }

  getByStorageZoneId = (storageZoneId: number): Observable<PlatformStorageReadingResource[]> =>
    this.http.get<PlatformStorageReadingResource[]>(storageReadingsApiEndpointUrl, {params: new HttpParams().set('storageZoneId', storageZoneId)})
      .pipe(catchError(this.handleError('Failed to fetch storage readings')));
}
