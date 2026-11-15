import {HttpClient, HttpParams} from '@angular/common/http';
import {catchError, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ErrorHandlingEnabledBaseType} from '../../shared/infrastructure/error-handling-enabled-base-type';
import {platformUrl} from '../../shared/infrastructure/platform-api';
import {PlatformNotificationResource} from './notifications-response';

const notificationsApiEndpointUrl = platformUrl(environment.platformProviderNotificationsEndpointPath);

/**
 * Endpoint that reads the notifications of a minimarket and marks them as read.
 */
export class NotificationsApiEndpoint extends ErrorHandlingEnabledBaseType {
  constructor(private http: HttpClient) {
    super();
  }

  getByMinimarketId = (minimarketId: string): Observable<PlatformNotificationResource[]> =>
    this.http.get<PlatformNotificationResource[]>(notificationsApiEndpointUrl, {params: new HttpParams().set('minimarketId', minimarketId)})
      .pipe(catchError(this.handleError('Failed to fetch notifications')));

  markAsRead = (notificationId: number): Observable<PlatformNotificationResource> =>
    this.http.post<PlatformNotificationResource>(`${notificationsApiEndpointUrl}/${notificationId}/readings`, {})
      .pipe(catchError(this.handleError('Failed to mark notification as read')));
}
