import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {forkJoin, map, Observable} from 'rxjs';
import {storedUserId} from '../../iam/infrastructure/token-storage';
import {ProfilesApiEndpoint} from '../../profiles/infrastructure/profiles-api-endpoint';
import {ProfileResource} from '../../profiles/infrastructure/profiles-response';
import {Clock} from '../../shared/domain/services/clock';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {respondWith} from '../../shared/infrastructure/in-memory-gateway';
import {PLATFORM_API_ENABLED} from '../../shared/infrastructure/platform-api';
import {ShipmentOrder} from '../domain/model/shipment-order.entity';
import {ShipmentOrderResource} from './procurements-response';
import {LINKED_MINIMARKETS, shipmentOrdersSeed} from './procurements-seed';
import {ShipmentOrderAssembler} from './shipment-order-assembler';
import {PlatformShipmentOrderResource} from './shipment-order-platform-response';
import {ShipmentOrdersApiEndpoint} from './shipment-orders-api-endpoint';

@Injectable({providedIn: 'root'})
/**
 * Infrastructure gateway to the procurements bounded context of the OrganiK Platform.
 *
 * @remarks
 * The platform records who decided an order by user identifier; the gateway shows the name of
 * that user's profile. Accepting an order registers its lots in the inventory of the minimarket.
 * When {@link PLATFORM_API_ENABLED} is off (unit tests), resources are kept in memory.
 */
export class ProcurementsApi extends BaseApi {
  private readonly http = inject(HttpClient);
  private readonly platformEnabled = inject(PLATFORM_API_ENABLED);
  private readonly assembler = inject(ShipmentOrderAssembler);
  private readonly shipmentOrdersEndpoint = new ShipmentOrdersApiEndpoint(this.http);
  private readonly profilesEndpoint = new ProfilesApiEndpoint(this.http);
  private readonly resources: ShipmentOrderResource[] = this.platformEnabled ? [] : shipmentOrdersSeed(inject(Clock).today());
  private profiles: ProfileResource[] = [];

  /**
   * Fetches every order.
   */
  getShipmentOrders(): Observable<ShipmentOrder[]> {
    if (!this.platformEnabled) {
      return respondWith({shipments: structuredClone(this.resources)}).pipe(
        map(response => this.assembler.toEntitiesFromResponse(response))
      );
    }
    return forkJoin([this.shipmentOrdersEndpoint.getForSession(), this.profilesEndpoint.getAll()]).pipe(
      map(([orders, profiles]) => {
        this.profiles = profiles;
        return this.assembler.toEntitiesFromResponse({shipments: orders.map(order => this.toResourceFromPlatform(order))});
      })
    );
  }

  /**
   * Fetches the minimarkets a supplier can send orders to. On the platform, those are the
   * minimarkets of the registered profiles, named after their administrator.
   */
  getLinkedMinimarkets(): Observable<{id: string; name: string}[]> {
    if (!this.platformEnabled) {
      return respondWith(structuredClone([...LINKED_MINIMARKETS]));
    }
    return this.profilesEndpoint.getAll().pipe(
      map(profiles => {
        this.profiles = profiles;
        const minimarkets = new Map<string, string>();
        for (const profile of profiles) {
          if (profile.minimarketId && !minimarkets.has(profile.minimarketId)) {
            minimarkets.set(profile.minimarketId, `Minimarket · ${profile.fullName}`);
          }
        }
        return [...minimarkets].map(([id, name]) => ({id, name}));
      })
    );
  }

  /**
   * Stores a new order.
   *
   * @param order - Order entity to create.
   */
  createShipmentOrder(order: ShipmentOrder): Observable<ShipmentOrder> {
    const resource = this.assembler.toResourceFromEntity(order);
    if (!this.platformEnabled) {
      this.resources.push(resource);
      return respondWith(order);
    }
    return this.shipmentOrdersEndpoint
      .create({supplierId: resource.supplierId, minimarketId: resource.minimarketId, lines: resource.lines})
      .pipe(map(created => this.assembler.toEntityFromResource(this.toResourceFromPlatform(created, resource.createdBy))));
  }

  /**
   * Replaces the stored version of an order. On the platform an answered order is sent as its acceptance or rejection.
   *
   * @param order - Updated order entity.
   */
  updateShipmentOrder(order: ShipmentOrder): Observable<ShipmentOrder> {
    if (!this.platformEnabled) {
      const index = this.resources.findIndex(resource => resource.id === order.id);
      this.resources[index] = this.assembler.toResourceFromEntity(order);
      return respondWith(order);
    }
    const decidedBy = storedUserId() ?? 0;
    const decision$ =
      order.status === 'rejected'
        ? this.shipmentOrdersEndpoint.reject(Number(order.id), decidedBy, order.decision?.reason ?? '')
        : this.shipmentOrdersEndpoint.accept(Number(order.id), decidedBy);
    return decision$.pipe(map(decided => this.assembler.toEntityFromResource(this.toResourceFromPlatform(decided, order.createdBy))));
  }

  private toResourceFromPlatform(order: PlatformShipmentOrderResource, createdBy?: string): ShipmentOrderResource {
    const status = order.status.toLowerCase();
    const deciderName = (userId: number | null) =>
      this.profiles.find(profile => profile.userId === userId)?.fullName ?? (userId === storedUserId() ? 'You' : `User ${userId}`);
    return {
      id: String(order.id),
      supplierId: order.supplierId,
      minimarketId: order.minimarketId,
      lines: order.lines.map(({productId, quantity, lotCode, expiresOn}) => ({productId, quantity, lotCode, expiresOn})),
      createdOn: (order.createdAt ?? new Date().toISOString()).slice(0, 10),
      createdBy: createdBy ?? this.profiles.find(profile => profile.supplierId === order.supplierId)?.fullName ?? order.supplierId,
      status,
      decision:
        status === 'pending'
          ? undefined
          : {
              decidedBy: deciderName(order.decidedBy),
              decidedOn: (order.decidedAt ?? new Date().toISOString()).slice(0, 10),
              reason: order.rejectionReason ?? ''
            }
    };
  }
}
