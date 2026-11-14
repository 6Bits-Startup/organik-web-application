import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

/**
 * Supply request returned by the OrganiK Platform.
 */
export interface PlatformSupplyRequestResource extends BaseResource {
  id: number;
  productId: string;
  supplierId: string;
  minimarketId: string;
  quantity: number;
  reason: string;
  /** Required day in ISO-8601 format (`yyyy-MM-dd`). */
  requiredDate: string;
  priority: string;
  status: string;
}

export interface PlatformSupplyRequestResponse extends BaseResponse, PlatformSupplyRequestResource {}

/**
 * Request body of `POST /supply-requests`.
 */
export interface CreateSupplyRequestRequest {
  productId: string;
  supplierId: string;
  minimarketId: string;
  quantity: number;
  reason: string;
  requiredDate: string;
  priority: string;
}
