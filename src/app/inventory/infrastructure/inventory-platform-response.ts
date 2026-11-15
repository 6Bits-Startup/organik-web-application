import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

/**
 * Stock lot returned by the OrganiK Platform.
 */
export interface PlatformStockLotResource extends BaseResource {
  id: number;
  minimarketId: string;
  productId: string;
  lotCode: string;
  quantity: number;
  minimumStock: number;
  /** Expiration day in ISO-8601 format (`yyyy-MM-dd`). */
  expirationDate: string;
  location: string;
  notes: string;
  lowStock: boolean;
}

export interface PlatformStockLotResponse extends BaseResponse, PlatformStockLotResource {}

/**
 * Request body of `POST /stock-lots`.
 */
export interface CreateStockLotRequest {
  minimarketId: string;
  productId: string;
  lotCode: string;
  quantity: number;
  minimumStock: number;
  expirationDate: string;
  location: string;
  notes: string;
}

/**
 * Request body of `PUT /stock-lots/{stockLotId}`.
 */
export interface UpdateStockLotRequest {
  location: string;
  notes: string;
  expirationDate: string;
}

/**
 * Inventory movement returned by the OrganiK Platform.
 */
export interface PlatformInventoryMovementResource extends BaseResource {
  id: number;
  stockLotId: number;
  type: string;
  quantity: number;
  reason: string | null;
  registeredAt: string;
}

/**
 * Request body of `POST /inventory-movements`.
 */
export interface RegisterInventoryMovementRequest {
  stockLotId: number;
  type: 'ENTRY' | 'EXIT' | 'ADJUSTMENT' | 'WASTE';
  quantity: number;
  reason: string;
}

/**
 * Offer of a stock lot returned by the OrganiK Platform.
 */
export interface PlatformOfferResource extends BaseResource {
  id: number;
  stockLotId: number;
  price: number;
  /** First day of the offer in ISO-8601 format (`yyyy-MM-dd`). */
  startsOn: string;
  /** Last day of the offer in ISO-8601 format (`yyyy-MM-dd`). */
  endsOn: string;
  active: boolean;
}

/**
 * Request body of `POST /offers`.
 */
export interface CreateOfferRequest {
  stockLotId: number;
  price: number;
  startsOn: string;
  endsOn: string;
}
