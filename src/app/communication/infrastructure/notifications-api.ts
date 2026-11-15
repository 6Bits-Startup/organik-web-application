import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {map, Observable, of} from 'rxjs';
import {storedMinimarketId} from '../../iam/infrastructure/token-storage';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {respondWith} from '../../shared/infrastructure/in-memory-gateway';
import {PLATFORM_API_ENABLED} from '../../shared/infrastructure/platform-api';
import {Notification} from '../domain/model/notification.entity';
import {NotificationAssembler} from './notification-assembler';
import {NotificationResource, PlatformNotificationResource} from './notifications-response';
import {NotificationsApiEndpoint} from './notifications-api-endpoint';

@Injectable({providedIn: 'root'})
/**
 * Infrastructure gateway to the communication bounded context of the OrganiK Platform.
 *
 * @remarks
 * The platform raises the notifications of a minimarket from what happens in the other contexts
 * (low stock, readings out of range, accepted orders). When {@link PLATFORM_API_ENABLED} is off
 * (unit tests), there are no notifications.
 */
export class NotificationsApi extends BaseApi {
  private readonly http = inject(HttpClient);
  private readonly platformEnabled = inject(PLATFORM_API_ENABLED);
  private readonly assembler = inject(NotificationAssembler);
  private readonly notificationsEndpoint = new NotificationsApiEndpoint(this.http);
  private readonly resources: NotificationResource[] = [];

  /**
   * Fetches the notifications of the minimarket of the signed-in user, the most recent first.
   */
  getNotifications(): Observable<Notification[]> {
    if (!this.platformEnabled) {
      return respondWith({notifications: structuredClone(this.resources)}).pipe(
        map(response => this.assembler.toEntitiesFromResponse(response))
      );
    }
    const minimarketId = storedMinimarketId();
    if (!minimarketId) {
      return of([]);
    }
    return this.notificationsEndpoint.getByMinimarketId(minimarketId).pipe(
      map(notifications =>
        this.assembler
          .toEntitiesFromResponse({notifications: notifications.map(notification => this.toResourceFromPlatform(notification))})
          .sort((a, b) => b.createdAt.toString().localeCompare(a.createdAt.toString()))
      )
    );
  }

  /**
   * Marks a notification as read.
   *
   * @param notification - Notification already marked as read by the domain.
   */
  markAsRead(notification: Notification): Observable<Notification> {
    if (!this.platformEnabled) {
      return respondWith(notification);
    }
    return this.notificationsEndpoint
      .markAsRead(Number(notification.id))
      .pipe(map(read => this.assembler.toEntityFromResource(this.toResourceFromPlatform(read))));
  }

  private toResourceFromPlatform(notification: PlatformNotificationResource): NotificationResource {
    return {
      id: String(notification.id),
      type: notification.type.toLowerCase().replace('_', '-'),
      severity: notification.severity.toLowerCase(),
      title: notification.title,
      read: notification.isRead,
      createdAt: notification.createdAt
    };
  }
}
