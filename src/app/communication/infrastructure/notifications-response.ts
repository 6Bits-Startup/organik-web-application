import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

/**
 * Raw response contract for the notifications endpoint.
 */
export interface NotificationsResponse {
  notifications: NotificationResource[];
}

/**
 * Raw notification resource exchanged with the backend.
 */
export interface NotificationResource {
  id: string;
  type: string;
  severity: string;
  title: string;
  read: boolean;
  /** Moment of the notification in ISO-8601 format. */
  createdAt: string;
}

/**
 * Notification returned by the OrganiK Platform.
 */
export interface PlatformNotificationResource extends BaseResource {
  id: number;
  minimarketId: string;
  type: string;
  severity: string;
  title: string;
  isRead: boolean;
  createdAt: string;
}

export interface PlatformNotificationResponse extends BaseResponse, PlatformNotificationResource {}
