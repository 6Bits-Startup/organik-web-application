import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {forkJoin, map, Observable, of, switchMap} from 'rxjs';
import {storedMinimarketId} from '../../iam/infrastructure/token-storage';
import {Clock} from '../../shared/domain/services/clock';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {respondWith} from '../../shared/infrastructure/in-memory-gateway';
import {PLATFORM_API_ENABLED} from '../../shared/infrastructure/platform-api';
import {StorageReading} from '../domain/model/storage-reading.entity';
import {StorageZone} from '../domain/model/storage-zone.entity';
import {PlatformStorageReadingResource, PlatformStorageZoneResource} from './conservation-platform-response';
import {StorageReadingResource, StorageZoneResource} from './conservation-response';
import {readingsSeed, ZONES_SEED} from './conservation-seed';
import {StorageReadingAssembler} from './storage-reading-assembler';
import {StorageReadingsApiEndpoint} from './storage-readings-api-endpoint';
import {StorageZoneAssembler} from './storage-zone-assembler';
import {StorageZonesApiEndpoint} from './storage-zones-api-endpoint';

/** Storage condition of the web application for each storage condition of the platform. */
const CONDITIONS: Readonly<Record<string, string>> = {
  REFRIGERATED: 'cold',
  COOL: 'fresh',
  AMBIENT: 'dry',
  FROZEN: 'frozen'
};

/** Storage condition of the platform for each storage condition of the web application. */
const PLATFORM_CONDITIONS: Readonly<Record<string, string>> = {
  cold: 'REFRIGERATED',
  fresh: 'COOL',
  dry: 'AMBIENT',
  frozen: 'FROZEN'
};

/** Reading source of the web application for each reading source of the platform. */
const SOURCES: Readonly<Record<string, string>> = {
  SENSOR: 'sensor',
  MANUAL: 'manual'
};

@Injectable({providedIn: 'root'})
/**
 * Infrastructure gateway to the conservation bounded context of the OrganiK Platform (zones and sensors).
 *
 * @remarks
 * Zones and readings belong to the minimarket of the signed-in user. The platform measures each
 * zone, not each product, so the readings it returns have no product. When
 * {@link PLATFORM_API_ENABLED} is off (unit tests), resources are kept in memory.
 */
export class ConservationApi extends BaseApi {
  private readonly http = inject(HttpClient);
  private readonly platformEnabled = inject(PLATFORM_API_ENABLED);
  private readonly zoneAssembler = inject(StorageZoneAssembler);
  private readonly readingAssembler = inject(StorageReadingAssembler);
  private readonly storageZonesEndpoint = new StorageZonesApiEndpoint(this.http);
  private readonly storageReadingsEndpoint = new StorageReadingsApiEndpoint(this.http);
  private readonly zoneResources: StorageZoneResource[] = structuredClone(ZONES_SEED);
  private readonly readingResources: StorageReadingResource[] = readingsSeed(inject(Clock).today());

  /**
   * Fetches every storage zone of the minimarket.
   */
  getZones(): Observable<StorageZone[]> {
    if (!this.platformEnabled) {
      return respondWith({zones: structuredClone(this.zoneResources)}).pipe(map(response => this.zoneAssembler.toEntitiesFromResponse(response)));
    }
    return this.minimarketZones().pipe(
      map(zones => this.zoneAssembler.toEntitiesFromResponse({zones: zones.map(zone => this.toZoneResourceFromPlatform(zone))}))
    );
  }

  /**
   * Fetches the readings of every storage zone, including the history of the last week.
   */
  getReadings(): Observable<StorageReading[]> {
    if (!this.platformEnabled) {
      return respondWith({readings: structuredClone(this.readingResources)}).pipe(
        map(response => this.readingAssembler.toEntitiesFromResponse(response))
      );
    }
    return this.minimarketZones().pipe(
      switchMap(zones => (zones.length ? forkJoin(zones.map(zone => this.storageReadingsEndpoint.getByStorageZoneId(zone.id))) : of([]))),
      map(readings =>
        this.readingAssembler.toEntitiesFromResponse({readings: readings.flat().map(reading => this.toReadingResourceFromPlatform(reading))})
      )
    );
  }

  /**
   * Creates a storage zone with the range its storage condition requires.
   *
   * @param zone - Zone to create.
   */
  createZone(zone: StorageZone): Observable<StorageZone> {
    if (!this.platformEnabled) {
      this.zoneResources.push({id: zone.id, name: zone.name, condition: zone.condition});
      return respondWith(zone);
    }
    return this.storageZonesEndpoint
      .create({
        minimarketId: storedMinimarketId(),
        name: zone.name,
        storageCondition: PLATFORM_CONDITIONS[zone.condition],
        minTemperature: zone.range.minTemperature,
        maxTemperature: zone.range.maxTemperature,
        minHumidity: zone.range.minHumidity,
        maxHumidity: zone.range.maxHumidity
      })
      .pipe(map(created => this.zoneAssembler.toEntityFromResource(this.toZoneResourceFromPlatform(created))));
  }

  /**
   * Records a reading taken in a storage zone.
   *
   * @param reading - Reading to record.
   */
  recordReading(reading: StorageReading): Observable<StorageReading> {
    const recordedAt = `${reading.recordedAt.toDisplayString().replace(' ', 'T')}:00`;
    if (!this.platformEnabled) {
      this.readingResources.push({
        zoneId: reading.zoneId,
        productId: reading.productId,
        temperature: reading.temperature,
        humidity: reading.humidity,
        recordedAt,
        source: reading.source
      });
      return respondWith(reading);
    }
    return this.storageReadingsEndpoint
      .create({
        storageZoneId: Number(reading.zoneId),
        temperature: reading.temperature,
        humidity: reading.humidity,
        recordedAt,
        source: reading.source === 'sensor' ? 'SENSOR' : 'MANUAL'
      })
      .pipe(map(recorded => this.readingAssembler.toEntityFromResource(this.toReadingResourceFromPlatform(recorded))));
  }

  /** Zones of the minimarket of the signed-in user; suppliers have no minimarket and therefore no zones. */
  private minimarketZones(): Observable<PlatformStorageZoneResource[]> {
    const minimarketId = storedMinimarketId();
    return minimarketId ? this.storageZonesEndpoint.getByMinimarketId(minimarketId) : of([]);
  }

  private toZoneResourceFromPlatform(zone: PlatformStorageZoneResource): StorageZoneResource {
    return {id: String(zone.id), name: zone.name, condition: CONDITIONS[zone.storageCondition] ?? 'fresh'};
  }

  private toReadingResourceFromPlatform(reading: PlatformStorageReadingResource): StorageReadingResource {
    return {
      zoneId: String(reading.storageZoneId),
      productId: '',
      temperature: reading.temperature,
      humidity: reading.humidity,
      recordedAt: reading.recordedAt,
      source: SOURCES[reading.source] ?? 'sensor'
    };
  }
}
