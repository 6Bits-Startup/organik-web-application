import {Injectable} from '@angular/core';
import {CalendarDate} from '../../shared/domain/model/calendar-date';
import {Money} from '../../shared/domain/model/money';
import {Offer} from '../domain/model/offer.entity';
import {OfferResource, OffersResponse} from './inventory-response';

/**
 * Maps offer resources from the backend into Offer domain entities and back.
 */
@Injectable({providedIn: 'root'})
export class OfferAssembler {
  /**
   * Converts an offer resource into an Offer entity.
   *
   * @param resource - Raw offer object returned by the backend.
   */
  toEntityFromResource(resource: OfferResource): Offer {
    return new Offer({
      id: resource.id,
      lotCode: resource.lotCode,
      productId: resource.productId,
      price: Money.of(resource.price),
      startsOn: CalendarDate.of(resource.startsOn),
      endsOn: CalendarDate.of(resource.endsOn)
    });
  }

  /**
   * Converts an offers payload into Offer entities.
   *
   * @param response - Backend response with offer resources.
   */
  toEntitiesFromResponse(response: OffersResponse): Offer[] {
    return response.offers.map(resource => this.toEntityFromResource(resource));
  }

  /**
   * Converts an Offer entity into the resource sent to the backend.
   *
   * @param offer - Entity to serialize.
   */
  toResourceFromEntity(offer: Offer): OfferResource {
    return {
      id: offer.id,
      lotCode: offer.lotCode,
      productId: offer.productId,
      price: offer.price.amount,
      startsOn: offer.startsOn.toString(),
      endsOn: offer.endsOn.toString()
    };
  }
}
