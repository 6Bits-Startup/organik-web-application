import {computed, inject, Injectable, signal} from '@angular/core';
import {Observable, tap} from 'rxjs';
import {ConservationStore} from '../../conservation/application/conservation.store';
import {DomainError} from '../../shared/domain/model/domain-error';
import {Notification} from '../domain/model/notification.entity';
import {NotificationsApi} from '../infrastructure/notifications-api';

@Injectable({providedIn: 'root'})
/**
 * Application service of the Communication bounded context: the alerts the minimarket has to act on.
 *
 * @remarks
 * Communication does not detect risks itself. It collects the alerts raised by the contexts that
 * do (Conservation, derived from the sensor readings) and the notifications the platform sends to
 * the minimarket, and offers them to the presentation layer, so the views that notify the user
 * depend on one place.
 */
export class AlertsStore {
  private readonly conservation = inject(ConservationStore);
  private readonly api = inject(NotificationsApi);

  private readonly notificationsSignal = signal<Notification[]>([]);
  private loaded = false;

  /** Active alerts, most urgent first. */
  readonly alerts = this.conservation.alerts;

  /** Notifications of the minimarket, the most recent first. */
  readonly notifications = this.notificationsSignal.asReadonly();

  /** Number of notifications that were not read yet. */
  readonly unreadCount = computed(() => this.notificationsSignal().filter(notification => !notification.read).length);

  /**
   * Loads the data the alerts are derived from and the notifications, once.
   */
  loadAlerts(): void {
    this.conservation.loadConservation();
    if (this.loaded) {
      return;
    }
    this.loaded = true;
    this.api.getNotifications().subscribe(notifications => this.notificationsSignal.set(notifications));
  }

  /**
   * Marks a notification as read.
   *
   * @param notificationId - Identifier of the notification.
   * @throws DomainError if the notification does not exist or was already read.
   */
  markAsRead(notificationId: string): Observable<Notification> {
    const notification = this.notificationsSignal().find(candidate => candidate.id === notificationId);
    if (!notification) {
      throw new DomainError(`Notification ${notificationId} does not exist`);
    }
    return this.api
      .markAsRead(notification.markAsRead())
      .pipe(tap(read => this.notificationsSignal.update(current => current.map(item => (item.id === read.id ? read : item)))));
  }
}
