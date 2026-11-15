import {CalendarDate} from '../../../shared/domain/model/calendar-date';
import {DomainError} from '../../../shared/domain/model/domain-error';
import {Money} from '../../../shared/domain/model/money';
import {Offer, OfferProps} from './offer.entity';

const props = (overrides: Partial<OfferProps> = {}): OfferProps => ({
  id: 'off-1',
  lotCode: 'LT-090',
  productId: 'ORG-04',
  price: Money.of(3.5),
  startsOn: CalendarDate.of('2026-10-02'),
  endsOn: CalendarDate.of('2026-10-05'),
  ...overrides
});

describe('Offer', () => {
  it('should be active from its first to its last day', () => {
    const offer = new Offer(props());

    expect(offer.isActiveOn(CalendarDate.of('2026-10-01'))).toBe(false);
    expect(offer.isActiveOn(CalendarDate.of('2026-10-02'))).toBe(true);
    expect(offer.isActiveOn(CalendarDate.of('2026-10-05'))).toBe(true);
    expect(offer.isActiveOn(CalendarDate.of('2026-10-06'))).toBe(false);
  });

  it('should need a price greater than zero', () => {
    expect(() => new Offer(props({price: Money.of(0)}))).toThrow(DomainError);
  });

  it('should not end before it starts', () => {
    expect(() => new Offer(props({endsOn: CalendarDate.of('2026-10-01')}))).toThrow(DomainError);
  });
});
