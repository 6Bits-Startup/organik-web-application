import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

/**
 * Category returned by the OrganiK Platform. Its name is the identifier the web application uses.
 */
export interface PlatformCategoryResource extends BaseResource {
  id: number;
  name: string;
  tone: string;
}

export interface PlatformCategoryResponse extends BaseResponse, PlatformCategoryResource {}

/**
 * Product returned by the OrganiK Platform.
 */
export interface PlatformProductResource extends BaseResource {
  id: number;
  sku: string;
  name: string;
  categoryId: number;
  supplierId: string | null;
  unit: string;
  minimumStock: number;
}

export interface PlatformProductResponse extends BaseResponse, PlatformProductResource {}

/**
 * Request body of `POST /products`.
 */
export interface CreateProductRequest {
  sku: string;
  name: string;
  categoryId: number;
  supplierId: string | null;
  unit: string;
  minimumStock: number;
}

/**
 * Request body of `PUT /products/{productId}`.
 */
export type UpdateProductRequest = Omit<CreateProductRequest, 'sku'>;
