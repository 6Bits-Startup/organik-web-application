import {Injectable} from '@angular/core';
import {DateTime} from '../../shared/domain/model/date-time';
import {Notification, NOTIFICATION_SEVERITIES, NOTIFICATION_TYPES} from '../domain/model/notification.entity';
import {NotificationResource, NotificationsResponse} from './notifications-response';

/**
 * Maps notification resources from the backend into Notification domain entities.
 */
@Injectable({providedIn: 'root'})
export class NotificationAssembler {
  /**
   * Converts a notification resource into a Notification entity.
   *
   * @param resource - Raw notification object returned by the backend.
   */
  toEntityFromResource(resource: NotificationResource): Notification {
    return new Notification({
      id: resource.id,
      type: NOTIFICATION_TYPES.find(type => type === resource.type) ?? 'order',
      severity: NOTIFICATION_SEVERITIES.find(severity => severity === resource.severity) ?? 'info',
      title: resource.title,
      read: resource.read,
      createdAt: new DateTime(resource.createdAt)
    });
  }

  /**
   * Converts a notifications payload into Notification entities.
   *
   * @param response - Backend response with notification resources.
   */
  toEntitiesFromResponse(response: NotificationsResponse): Notification[] {
    return response.notifications.map(resource => this.toEntityFromResource(resource));
  }
}
