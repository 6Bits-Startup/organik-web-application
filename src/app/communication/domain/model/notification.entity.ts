import {DateTime} from '../../../shared/domain/model/date-time';
import {DomainError} from '../../../shared/domain/model/domain-error';

/** What a notification is about. */
export type NotificationType = 'expiration' | 'conservation' | 'low-stock' | 'replenishment' | 'order';

/** Every notification type. */
export const NOTIFICATION_TYPES: readonly NotificationType[] = ['expiration', 'conservation', 'low-stock', 'replenishment', 'order'];

/** How urgent a notification is. */
export type NotificationSeverity = 'info' | 'warning' | 'critical';

/** Every notification severity. */
export const NOTIFICATION_SEVERITIES: readonly NotificationSeverity[] = ['info', 'warning', 'critical'];

/** Data needed to create a notification. */
export interface NotificationProps {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  read: boolean;
  createdAt: DateTime;
}

/**
 * Represents a notification sent to the staff of the minimarket when something happens in the
 * operation: a low stock, a reading out of range or an accepted order.
 */
export class Notification {
  readonly id: string;
  readonly type: NotificationType;
  readonly severity: NotificationSeverity;
  readonly title: string;
  readonly read: boolean;
  readonly createdAt: DateTime;

  /**
   * @param props - Data of the notification.
   * @throws DomainError if the identifier or the title is blank.
   */
  constructor(props: NotificationProps) {
    if (!props.id.trim() || !props.title.trim()) {
      throw new DomainError('A notification needs an identifier and a title');
    }
    this.id = props.id;
    this.type = props.type;
    this.severity = props.severity;
    this.title = props.title;
    this.read = props.read;
    this.createdAt = props.createdAt;
  }

  /**
   * @returns The same notification marked as read.
   * @throws DomainError if it was already read.
   */
  markAsRead(): Notification {
    if (this.read) {
      throw new DomainError(`Notification ${this.id} was already read`);
    }
    return new Notification({...this, read: true});
  }
}
