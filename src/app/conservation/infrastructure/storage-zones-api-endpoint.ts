import {HttpClient, HttpParams} from '@angular/common/http';
import {catchError, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ErrorHandlingEnabledBaseType} from '../../shared/infrastructure/error-handling-enabled-base-type';
import {platformUrl} from '../../shared/infrastructure/platform-api';
import {CreateStorageZoneRequest, PlatformStorageZoneResource} from './conservation-platform-response';

const storageZonesApiEndpointUrl = platformUrl(environment.platformProviderStorageZonesEndpointPath);

/**
 * Endpoint that reads and creates the storage zones of a minimarket.
 */
export class StorageZonesApiEndpoint extends ErrorHandlingEnabledBaseType {
  constructor(private http: HttpClient) {
    super();
  }

  getByMinimarketId = (minimarketId: string): Observable<PlatformStorageZoneResource[]> =>
    this.http.get<PlatformStorageZoneResource[]>(storageZonesApiEndpointUrl, {params: new HttpParams().set('minimarketId', minimarketId)})
      .pipe(catchError(this.handleError('Failed to fetch storage zones')));

  create = (request: CreateStorageZoneRequest): Observable<PlatformStorageZoneResource> =>
    this.http.post<PlatformStorageZoneResource>(storageZonesApiEndpointUrl, request)
      .pipe(catchError(this.handleError('Failed to create storage zone')));
}
