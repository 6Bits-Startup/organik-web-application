import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

/**
 * Line of a shipment order returned by the OrganiK Platform.
 */
export interface PlatformShipmentOrderLineResource {
  id: number;
  productId: string;
  quantity: number;
  lotCode: string;
  expiresOn: string;
}

/**
 * Shipment order returned by the OrganiK Platform.
 */
export interface PlatformShipmentOrderResource extends BaseResource {
  id: number;
  supplierId: string;
  minimarketId: string;
  lines: PlatformShipmentOrderLineResource[];
  status: string;
  decidedBy: number | null;
  decidedAt: string | null;
  rejectionReason: string | null;
  createdAt: string | null;
}

export interface PlatformShipmentOrderResponse extends BaseResponse, PlatformShipmentOrderResource {}

/**
 * Request body of `POST /shipment-orders`.
 */
export interface CreateShipmentOrderRequest {
  supplierId: string;
  minimarketId: string;
  lines: {productId: string; quantity: number; lotCode: string; expiresOn: string}[];
}
