import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

/**
 * Storage zone returned by the OrganiK Platform.
 */
export interface PlatformStorageZoneResource extends BaseResource {
  id: number;
  name: string;
  storageCondition: string;
  minTemperature: number;
  maxTemperature: number;
  minHumidity: number;
  maxHumidity: number;
}

export interface PlatformStorageZoneResponse extends BaseResponse, PlatformStorageZoneResource {}

/**
 * Storage reading returned by the OrganiK Platform.
 */
export interface PlatformStorageReadingResource extends BaseResource {
  id: number;
  storageZoneId: number;
  temperature: number;
  humidity: number;
  recordedAt: string;
  source: string;
  withinRange: boolean;
}
