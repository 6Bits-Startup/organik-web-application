import {HttpClient, HttpParams} from '@angular/common/http';
import {catchError, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ErrorHandlingEnabledBaseType} from '../../shared/infrastructure/error-handling-enabled-base-type';
import {platformUrl} from '../../shared/infrastructure/platform-api';
import {CreateProfileRequest} from './create-profile.request';
import {ProfileResource} from './profiles-response';
import {UpdateProfilePreferencesRequest} from './update-profile-preferences.request';

const profilesApiEndpointUrl = platformUrl(environment.platformProviderProfilesEndpointPath);

/**
 * Endpoint that reads and writes the profiles of the OrganiK Platform.
 */
export class ProfilesApiEndpoint extends ErrorHandlingEnabledBaseType {
  constructor(private http: HttpClient) {
    super();
  }

  getAll = (): Observable<ProfileResource[]> =>
    this.http.get<ProfileResource[]>(profilesApiEndpointUrl).pipe(catchError(this.handleError('Failed to fetch profiles')));

  getByUserId = (userId: number): Observable<ProfileResource[]> =>
    this.http.get<ProfileResource[]>(profilesApiEndpointUrl, {params: new HttpParams().set('userId', userId)})
      .pipe(catchError(this.handleError('Failed to fetch profile')));

  getByMinimarketId = (minimarketId: string): Observable<ProfileResource[]> =>
    this.http.get<ProfileResource[]>(profilesApiEndpointUrl, {params: new HttpParams().set('minimarketId', minimarketId)})
      .pipe(catchError(this.handleError('Failed to fetch profiles of the minimarket')));

  create = (request: CreateProfileRequest): Observable<ProfileResource> =>
    this.http.post<ProfileResource>(profilesApiEndpointUrl, request).pipe(catchError(this.handleError('Failed to create profile')));

  updatePreferences = (profileId: number, request: UpdateProfilePreferencesRequest): Observable<ProfileResource> =>
    this.http.put<ProfileResource>(`${profilesApiEndpointUrl}/${profileId}/preferences`, request)
      .pipe(catchError(this.handleError('Failed to update profile preferences')));
}
