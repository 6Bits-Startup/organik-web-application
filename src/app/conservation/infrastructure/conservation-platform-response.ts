import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

/**
 * Storage zone returned by the OrganiK Platform.
 */
export interface PlatformStorageZoneResource extends BaseResource {
  id: number;
  minimarketId: string;
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

/**
 * Request body of `POST /storage-zones`.
 */
export interface CreateStorageZoneRequest {
  minimarketId: string;
  name: string;
  storageCondition: string;
  minTemperature: number;
  maxTemperature: number;
  minHumidity: number;
  maxHumidity: number;
}

/**
 * Request body of `POST /storage-readings`.
 */
export interface RecordStorageReadingRequest {
  storageZoneId: number;
  temperature: number;
  humidity: number;
  /** Local moment of the measurement, e.g. `2026-11-15T09:30:00`. */
  recordedAt: string;
  source: string;
}
