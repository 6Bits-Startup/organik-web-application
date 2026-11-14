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
