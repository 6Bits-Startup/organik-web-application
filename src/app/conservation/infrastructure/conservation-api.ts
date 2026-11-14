import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {forkJoin, map, Observable, of, switchMap} from 'rxjs';
import {Clock} from '../../shared/domain/services/clock';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {respondWith} from '../../shared/infrastructure/in-memory-gateway';
import {PLATFORM_API_ENABLED} from '../../shared/infrastructure/platform-api';
import {StorageReading} from '../domain/model/storage-reading.entity';
import {StorageZone} from '../domain/model/storage-zone.entity';
import {PlatformStorageZoneResource} from './conservation-platform-response';
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

/** Reading source of the web application for each reading source of the platform. */
const SOURCES: Readonly<Record<string, string>> = {
  SENSOR: 'sensor',
  MANUAL: 'simulated'
};

@Injectable({providedIn: 'root'})
/**
 * Infrastructure gateway to the conservation bounded context of the OrganiK Platform (zones and sensors).
 *
 * @remarks
 * The platform measures each zone, not each product, so the readings it returns have no product.
 * When {@link PLATFORM_API_ENABLED} is off (unit tests), resources are kept in memory.
 */
export class ConservationApi extends BaseApi {
  private readonly http = inject(HttpClient);
  private readonly platformEnabled = inject(PLATFORM_API_ENABLED);
  private readonly zoneAssembler = inject(StorageZoneAssembler);
  private readonly readingAssembler = inject(StorageReadingAssembler);
  private readonly clock = inject(Clock);
  private readonly storageZonesEndpoint = new StorageZonesApiEndpoint(this.http);
  private readonly storageReadingsEndpoint = new StorageReadingsApiEndpoint(this.http);

  /**
   * Fetches every storage zone.
   */
  getZones(): Observable<StorageZone[]> {
    if (!this.platformEnabled) {
      return respondWith({zones: structuredClone(ZONES_SEED)}).pipe(map(response => this.zoneAssembler.toEntitiesFromResponse(response)));
    }
    return this.storageZonesEndpoint.getAll().pipe(
      map(zones => this.zoneAssembler.toEntitiesFromResponse({zones: zones.map(zone => this.toZoneResourceFromPlatform(zone))}))
    );
  }

  /**
   * Fetches the readings of every storage zone, including the history of the last week.
   */
  getReadings(): Observable<StorageReading[]> {
    if (!this.platformEnabled) {
      return respondWith({readings: readingsSeed(this.clock.today())}).pipe(
        map(response => this.readingAssembler.toEntitiesFromResponse(response))
      );
    }
    return this.storageZonesEndpoint.getAll().pipe(
      switchMap(zones => (zones.length ? forkJoin(zones.map(zone => this.storageReadingsEndpoint.getByStorageZoneId(zone.id))) : of([]))),
      map(readings =>
        this.readingAssembler.toEntitiesFromResponse({
          readings: readings.flat().map(reading => ({
            zoneId: String(reading.storageZoneId),
            productId: '',
            temperature: reading.temperature,
            humidity: reading.humidity,
            recordedAt: reading.recordedAt,
            source: SOURCES[reading.source] ?? 'sensor'
          }))
        })
      )
    );
  }

  private toZoneResourceFromPlatform(zone: PlatformStorageZoneResource) {
    return {id: String(zone.id), name: zone.name, condition: CONDITIONS[zone.storageCondition] ?? 'fresh'};
  }
}
