import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

/**
 * Operational indicators of a minimarket computed by the OrganiK Platform.
 */
export interface PlatformOperationalIndicatorsResource extends BaseResource {
  minimarketId: string;
  expiredLots: number;
  lotsExpiringWithin7Days: number;
  lotsExpiringWithin15Days: number;
  wasteUnits: number;
  outOfRangeReadings: number;
  acceptedShipmentOrders: number;
  rejectedShipmentOrders: number;
  /** Share of decided shipment orders that were accepted, 0–100. */
  shipmentOrderAcceptanceRate: number;
}

export interface PlatformOperationalIndicatorsResponse extends BaseResponse, PlatformOperationalIndicatorsResource {}

/**
 * Activity of a minimarket recorded by the OrganiK Platform.
 */
export interface PlatformActivityRecordResource extends BaseResource {
  id: number;
  minimarketId: string;
  type: string;
  description: string;
  occurredAt: string;
}
