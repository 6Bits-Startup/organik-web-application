import {CalendarDate} from '../../../shared/domain/model/calendar-date';
import {DomainError} from '../../../shared/domain/model/domain-error';
import {Money} from '../../../shared/domain/model/money';

/** Data needed to create an offer. */
export interface OfferProps {
  id: string;
  /** Lot whose units are sold at the offer price. */
  lotCode: string;
  /** SKU of the product of the lot. */
  productId: string;
  price: Money;
  startsOn: CalendarDate;
  endsOn: CalendarDate;
}

/**
 * Represents a special price for the units of a stock lot during a period, usually to sell
 * them before they expire. An offer does not discount the stock.
 */
export class Offer {
  readonly id: string;
  readonly lotCode: string;
  readonly productId: string;
  readonly price: Money;
  readonly startsOn: CalendarDate;
  readonly endsOn: CalendarDate;

  /**
   * @param props - Data of the offer.
   * @throws DomainError if the identifier or the lot is blank, the price is zero or the period ends before it starts.
   */
  constructor(props: OfferProps) {
    if (!props.id.trim() || !props.lotCode.trim()) {
      throw new DomainError('An offer needs an identifier and a lot');
    }
    if (props.price.amount <= 0) {
      throw new DomainError('An offer needs a price greater than zero');
    }
    if (props.endsOn.isBefore(props.startsOn)) {
      throw new DomainError('An offer cannot end before it starts');
    }
    this.id = props.id;
    this.lotCode = props.lotCode;
    this.productId = props.productId;
    this.price = props.price;
    this.startsOn = props.startsOn;
    this.endsOn = props.endsOn;
  }

  /**
   * @param today - Day to check.
   * @returns Whether the day is inside the period of the offer.
   */
  isActiveOn(today: CalendarDate): boolean {
    return !today.isBefore(this.startsOn) && !this.endsOn.isBefore(today);
  }
}
