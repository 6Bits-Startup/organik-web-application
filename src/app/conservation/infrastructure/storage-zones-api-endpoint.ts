import {HttpClient} from '@angular/common/http';
import {catchError, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ErrorHandlingEnabledBaseType} from '../../shared/infrastructure/error-handling-enabled-base-type';
import {platformUrl} from '../../shared/infrastructure/platform-api';
import {PlatformStorageZoneResource} from './conservation-platform-response';

const storageZonesApiEndpointUrl = platformUrl(environment.platformProviderStorageZonesEndpointPath);

/**
 * Endpoint that reads the storage zones of the OrganiK Platform.
 */
export class StorageZonesApiEndpoint extends ErrorHandlingEnabledBaseType {
  constructor(private http: HttpClient) {
    super();
  }

  getAll = (): Observable<PlatformStorageZoneResource[]> =>
    this.http.get<PlatformStorageZoneResource[]>(storageZonesApiEndpointUrl).pipe(catchError(this.handleError('Failed to fetch storage zones')));
}
