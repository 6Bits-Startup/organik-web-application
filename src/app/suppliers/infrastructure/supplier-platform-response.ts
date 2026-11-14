import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

/**
 * Supplier returned by the OrganiK Platform.
 */
export interface PlatformSupplierResource extends BaseResource {
  id: number;
  businessName: string;
  contactName: string;
  phoneNumber: string;
  email: string;
  categories: string[];
  organicCertification: string;
}

export interface PlatformSupplierResponse extends BaseResponse, PlatformSupplierResource {}

/**
 * Request body of `POST /suppliers`.
 */
export interface CreateSupplierRequest {
  businessName: string;
  contactName: string;
  phoneNumber: string;
  email: string;
  categories: string[];
  organicCertification: string;
}

/**
 * Offered product returned by the OrganiK Platform.
 */
export interface PlatformOfferedProductResource extends BaseResource {
  id: number;
  supplierId: string;
  productId: string;
  lotCode: string;
  availableQuantity: number;
  expiresOn: string;
}

/**
 * Request body of `POST /offered-products`.
 */
export interface CreateOfferedProductRequest {
  supplierId: string;
  productId: string;
  lotCode: string;
  availableQuantity: number;
  expiresOn: string;
}
