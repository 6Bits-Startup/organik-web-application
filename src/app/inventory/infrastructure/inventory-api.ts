import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {forkJoin, map, Observable, of, switchMap} from 'rxjs';
import {storedMinimarketId} from '../../iam/infrastructure/token-storage';
import {Clock} from '../../shared/domain/services/clock';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {respondWith} from '../../shared/infrastructure/in-memory-gateway';
import {PLATFORM_API_ENABLED} from '../../shared/infrastructure/platform-api';
import {InventoryEvent} from '../domain/model/inventory-event';
import {Offer} from '../domain/model/offer.entity';
import {StockLot} from '../domain/model/stock-lot.entity';
import {InventoryEventAssembler} from './inventory-event-assembler';
import {InventoryMovementsApiEndpoint} from './inventory-movements-api-endpoint';
import {PlatformInventoryMovementResource, PlatformOfferResource, PlatformStockLotResource} from './inventory-platform-response';
import {InventoryEventResource, OfferResource, StockLotResource} from './inventory-response';
import {inventoryEventsSeed, offersSeed, stockLotsSeed} from './inventory-seed';
import {OfferAssembler} from './offer-assembler';
import {OffersApiEndpoint} from './offers-api-endpoint';
import {StockLotAssembler} from './stock-lot-assembler';
import {StockLotsApiEndpoint} from './stock-lots-api-endpoint';

/** Kind of inventory event shown for each movement type of the platform. */
const EVENT_TYPES_BY_MOVEMENT: Readonly<Record<string, string>> = {
  ENTRY: 'registered',
  EXIT: 'updated',
  ADJUSTMENT: 'updated',
  WASTE: 'waste'
};

@Injectable({providedIn: 'root'})
/**
 * Infrastructure gateway to the inventory bounded context of the OrganiK Platform.
 *
 * @remarks
 * Lots and their offers are read and registered for the minimarket of the signed-in user. A
 * change in the quantity of a lot is sent as an inventory movement (`WASTE` for losses,
 * `ADJUSTMENT` for a new count) and the history is built from those movements; its location,
 * notes and expiration date are updated with `PUT /stock-lots/{id}`. When
 * {@link PLATFORM_API_ENABLED} is off (unit tests), resources are kept in memory.
 */
export class InventoryApi extends BaseApi {
  private readonly http = inject(HttpClient);
  private readonly platformEnabled = inject(PLATFORM_API_ENABLED);
  private readonly assembler = inject(StockLotAssembler);
  private readonly eventAssembler = inject(InventoryEventAssembler);
  private readonly offerAssembler = inject(OfferAssembler);
  private readonly stockLotsEndpoint = new StockLotsApiEndpoint(this.http);
  private readonly movementsEndpoint = new InventoryMovementsApiEndpoint(this.http);
  private readonly offersEndpoint = new OffersApiEndpoint(this.http);
  private readonly resources: StockLotResource[];
  private readonly eventResources: InventoryEventResource[];
  private readonly offerResources: OfferResource[];
  private platformLots: PlatformStockLotResource[] = [];

  constructor() {
    super();
    const today = inject(Clock).today();
    this.resources = this.platformEnabled ? [] : stockLotsSeed(today);
    this.eventResources = this.platformEnabled ? [] : inventoryEventsSeed(today);
    this.offerResources = this.platformEnabled ? [] : offersSeed(today);
  }

  /**
   * Fetches every stock lot of the minimarket.
   */
  getStockLots(): Observable<StockLot[]> {
    if (!this.platformEnabled) {
      return respondWith({lots: structuredClone(this.resources)}).pipe(
        map(response => this.assembler.toEntitiesFromResponse(response))
      );
    }
    return this.minimarketLots().pipe(
      map(lots => {
        this.platformLots = lots;
        return this.assembler.toEntitiesFromResponse({lots: lots.map(lot => this.toResourceFromPlatform(lot))});
      })
    );
  }

  /**
   * Persists a newly received lot.
   *
   * @param lot - Lot entity to store.
   * @param minimumStock - Minimum stock of the product, used by the platform to detect low stock.
   */
  createStockLot(lot: StockLot, minimumStock = 0): Observable<StockLot> {
    const resource = this.assembler.toResourceFromEntity(lot);
    this.remember(resource);
    if (!this.platformEnabled) {
      return respondWith(lot);
    }
    return this.stockLotsEndpoint
      .create({
        minimarketId: storedMinimarketId(),
        productId: lot.productId,
        lotCode: lot.lotCode,
        quantity: lot.quantity.value,
        minimumStock,
        expirationDate: lot.expiresOn.toString(),
        location: lot.location,
        notes: lot.notes
      })
      .pipe(
        map(created => {
          this.platformLots = [...this.platformLots, created];
          return this.assembler.toEntityFromResource(this.toResourceFromPlatform(created));
        })
      );
  }

  /**
   * Replaces the stored version of a lot. On the platform a new quantity is registered as a
   * movement and a new location, notes or expiration date with `PUT /stock-lots/{id}`.
   *
   * @param lot - Updated lot entity.
   * @param wasteCause - Cause of the loss when the units were wasted; a new count otherwise.
   */
  updateStockLot(lot: StockLot, wasteCause?: string): Observable<StockLot> {
    const previous = this.platformLots.find(candidate => candidate.lotCode === lot.lotCode);
    this.remember(this.assembler.toResourceFromEntity(lot));
    if (!this.platformEnabled || !previous) {
      return respondWith(lot);
    }
    const quantityChanged = previous.quantity !== lot.quantity.value;
    const informationChanged =
      previous.location !== lot.location || previous.notes !== lot.notes || previous.expirationDate !== lot.expiresOn.toString();
    const movement$: Observable<unknown> = !quantityChanged
      ? of(null)
      : wasteCause
        ? this.movementsEndpoint.register({stockLotId: previous.id, type: 'WASTE', quantity: previous.quantity - lot.quantity.value, reason: wasteCause})
        : this.movementsEndpoint.register({stockLotId: previous.id, type: 'ADJUSTMENT', quantity: lot.quantity.value, reason: 'Lot updated'});
    const information$: Observable<unknown> = informationChanged
      ? this.stockLotsEndpoint.update(previous.id, {location: lot.location, notes: lot.notes, expirationDate: lot.expiresOn.toString()})
      : of(null);
    return movement$.pipe(
      switchMap(() => information$),
      switchMap(() => this.stockLotsEndpoint.getById(previous.id)),
      map(updated => {
        this.platformLots = this.platformLots.map(candidate => (candidate.id === updated.id ? updated : candidate));
        return this.assembler.toEntityFromResource(this.toResourceFromPlatform(updated));
      })
    );
  }

  /**
   * Adds the lots of an accepted order to the inventory. On the platform the lots were already
   * registered when the order was accepted, so they are only read again.
   *
   * @param lots - Lots that enter the inventory.
   * @returns Every lot of the minimarket after the reception.
   */
  receiveOrder(lots: readonly StockLot[]): Observable<StockLot[]> {
    if (this.platformEnabled) {
      return this.getStockLots();
    }
    return forkJoin(lots.map(lot => this.createStockLot(lot))).pipe(switchMap(() => this.getStockLots()));
  }

  /**
   * Fetches the inventory history.
   */
  getEvents(): Observable<InventoryEvent[]> {
    if (!this.platformEnabled) {
      return respondWith({events: structuredClone(this.eventResources)}).pipe(
        map(response => this.eventAssembler.toEntitiesFromResponse(response))
      );
    }
    return this.minimarketLots().pipe(
      switchMap(lots => {
        this.platformLots = lots;
        return lots.length
          ? forkJoin(lots.map(lot => this.movementsEndpoint.getByStockLotId(lot.id).pipe(map(movements => ({lot, movements})))))
          : of([]);
      }),
      map(history => {
        const events = history.flatMap(({lot, movements}) => movements.map(movement => this.toEventFromPlatform(lot, movement)));
        return this.eventAssembler.toEntitiesFromResponse({events: [...events, ...structuredClone(this.eventResources)]});
      })
    );
  }

  /**
   * Persists an inventory event. On the platform, losses and new counts already come from the
   * movements; the other events are only kept in this session.
   *
   * @param event - Event entity to store.
   */
  createEvent(event: InventoryEvent): Observable<InventoryEvent> {
    if (!this.platformEnabled || (event.type !== 'waste' && event.type !== 'updated')) {
      this.eventResources.push(this.eventAssembler.toResourceFromEntity(event));
    }
    return respondWith(event);
  }

  /**
   * Fetches the offers of the lots of the minimarket.
   */
  getOffers(): Observable<Offer[]> {
    if (!this.platformEnabled) {
      return respondWith({offers: structuredClone(this.offerResources)}).pipe(
        map(response => this.offerAssembler.toEntitiesFromResponse(response))
      );
    }
    return this.minimarketLots().pipe(
      switchMap(lots => {
        this.platformLots = lots;
        return lots.length
          ? forkJoin(lots.map(lot => this.offersEndpoint.getByStockLotId(lot.id).pipe(map(offers => ({lot, offers})))))
          : of([]);
      }),
      map(offersByLot =>
        this.offerAssembler.toEntitiesFromResponse({
          offers: offersByLot.flatMap(({lot, offers}) => offers.map(offer => this.toOfferResourceFromPlatform(lot, offer)))
        })
      )
    );
  }

  /**
   * Persists an offer of a lot.
   *
   * @param offer - Offer entity to store.
   */
  createOffer(offer: Offer): Observable<Offer> {
    if (!this.platformEnabled) {
      this.offerResources.push(this.offerAssembler.toResourceFromEntity(offer));
      return respondWith(offer);
    }
    const lot = this.platformLots.find(candidate => candidate.lotCode === offer.lotCode);
    if (!lot) {
      throw new Error(`Lot ${offer.lotCode} is not registered in the platform`);
    }
    return this.offersEndpoint
      .create({stockLotId: lot.id, price: offer.price.amount, startsOn: offer.startsOn.toString(), endsOn: offer.endsOn.toString()})
      .pipe(map(created => this.offerAssembler.toEntityFromResource(this.toOfferResourceFromPlatform(lot, created))));
  }

  /** Lots of the minimarket of the signed-in user; suppliers have no minimarket and therefore no lots. */
  private minimarketLots(): Observable<PlatformStockLotResource[]> {
    const minimarketId = storedMinimarketId();
    return minimarketId ? this.stockLotsEndpoint.getByMinimarketId(minimarketId) : of([]);
  }

  private remember(resource: StockLotResource): void {
    const index = this.resources.findIndex(candidate => candidate.lotCode === resource.lotCode);
    if (index < 0) {
      this.resources.push(resource);
    } else {
      this.resources[index] = resource;
    }
  }

  private toResourceFromPlatform(lot: PlatformStockLotResource): StockLotResource {
    return {
      lotCode: lot.lotCode,
      productId: lot.productId,
      quantity: lot.quantity,
      expiresOn: lot.expirationDate,
      location: lot.location,
      notes: lot.notes
    };
  }

  private toOfferResourceFromPlatform(lot: PlatformStockLotResource, offer: PlatformOfferResource): OfferResource {
    return {
      id: String(offer.id),
      lotCode: lot.lotCode,
      productId: lot.productId,
      price: offer.price,
      startsOn: offer.startsOn,
      endsOn: offer.endsOn
    };
  }

  private toEventFromPlatform(lot: PlatformStockLotResource, movement: PlatformInventoryMovementResource): InventoryEventResource {
    const type = EVENT_TYPES_BY_MOVEMENT[movement.type] ?? 'updated';
    return {
      id: `mov-${movement.id}`,
      type,
      productId: lot.productId,
      lotCode: lot.lotCode,
      quantity: type === 'updated' ? null : movement.quantity,
      cause: type === 'waste' ? movement.reason ?? '' : '',
      detail: type === 'waste' ? `${movement.quantity} units lost` : movement.reason ?? '',
      actorName: 'OrganiK Platform',
      occurredOn: movement.registeredAt.slice(0, 10)
    };
  }
}
