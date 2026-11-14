import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {map, Observable, of} from 'rxjs';
import {storedMinimarketId} from '../../iam/infrastructure/token-storage';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {respondWith} from '../../shared/infrastructure/in-memory-gateway';
import {PLATFORM_API_ENABLED} from '../../shared/infrastructure/platform-api';
import {AlertTrend} from '../domain/model/alert-trend';
import {OperationalIndicators} from '../domain/model/operational-indicators';
import {ActivityRecordsApiEndpoint} from './activity-records-api-endpoint';
import {PlatformActivityRecordResource, PlatformOperationalIndicatorsResource} from './analytics-platform-response';
import {ALERT_TREND_SEED, INDICATORS_SEED} from './analytics-seed';
import {IndicatorsAssembler} from './indicators-assembler';
import {OperationalIndicatorsApiEndpoint} from './operational-indicators-api-endpoint';

/** Activity types of the platform that are alerts for the minimarket. */
const ALERT_TYPES: readonly string[] = ['LOW_STOCK_DETECTED', 'STORAGE_READING_OUT_OF_RANGE'];

/** Weeks shown in the alert trend. */
const TREND_WEEKS = 6;

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable({providedIn: 'root'})
/**
 * Infrastructure gateway to the analytics bounded context of the OrganiK Platform.
 *
 * @remarks
 * Indicators come from `/operational-indicators` of the minimarket of the signed-in user and the
 * alert trend counts its low-stock and out-of-range alerts of the last weeks. The platform has
 * no prices, so the avoided loss is not available (0). When {@link PLATFORM_API_ENABLED} is off
 * (unit tests), figures come from in-memory data.
 */
export class AnalyticsApi extends BaseApi {
  private readonly http = inject(HttpClient);
  private readonly platformEnabled = inject(PLATFORM_API_ENABLED);
  private readonly assembler = inject(IndicatorsAssembler);
  private readonly indicatorsEndpoint = new OperationalIndicatorsApiEndpoint(this.http);
  private readonly activityRecordsEndpoint = new ActivityRecordsApiEndpoint(this.http);

  /**
   * Fetches the operational indicators.
   */
  getIndicators(): Observable<OperationalIndicators> {
    if (!this.platformEnabled) {
      return respondWith(structuredClone(INDICATORS_SEED)).pipe(map(resource => this.assembler.toIndicatorsFromResource(resource)));
    }
    const minimarketId = storedMinimarketId();
    if (!minimarketId) {
      return of(this.assembler.toIndicatorsFromResource({avoidedLoss: 0, productsAtRisk: 0, acceptedRequestsRate: 0, operationalHealth: 100}));
    }
    return this.indicatorsEndpoint.getByMinimarketId(minimarketId).pipe(
      map(indicators => this.assembler.toIndicatorsFromResource(this.toResourceFromPlatform(indicators)))
    );
  }

  /**
   * Fetches the alerts raised per week.
   */
  getAlertTrend(): Observable<AlertTrend> {
    if (!this.platformEnabled) {
      return respondWith(structuredClone(ALERT_TREND_SEED)).pipe(map(response => this.assembler.toTrendFromResponse(response)));
    }
    const minimarketId = storedMinimarketId();
    if (!minimarketId) {
      return of(this.assembler.toTrendFromResponse({points: this.weeklyAlerts([])}));
    }
    return this.activityRecordsEndpoint.getByMinimarketId(minimarketId).pipe(
      map(records => this.assembler.toTrendFromResponse({points: this.weeklyAlerts(records)}))
    );
  }

  private toResourceFromPlatform(indicators: PlatformOperationalIndicatorsResource) {
    const problems = indicators.expiredLots * 10 + indicators.lotsExpiringWithin7Days * 2 + indicators.outOfRangeReadings * 5;
    return {
      avoidedLoss: 0,
      productsAtRisk: indicators.expiredLots + indicators.lotsExpiringWithin7Days,
      acceptedRequestsRate: indicators.shipmentOrderAcceptanceRate,
      operationalHealth: Math.max(0, 100 - problems)
    };
  }

  private weeklyAlerts(records: readonly PlatformActivityRecordResource[]) {
    const now = Date.now();
    const counts = new Array<number>(TREND_WEEKS).fill(0);
    for (const record of records.filter(candidate => ALERT_TYPES.includes(candidate.type))) {
      const weeksAgo = Math.floor((now - new Date(record.occurredAt).getTime()) / (7 * DAY_MS));
      if (weeksAgo >= 0 && weeksAgo < TREND_WEEKS) {
        counts[TREND_WEEKS - 1 - weeksAgo]++;
      }
    }
    return counts.map((count, index) => ({label: `S${index + 1}`, count}));
  }
}
