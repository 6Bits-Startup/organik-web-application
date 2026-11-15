import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {map, Observable, of, switchMap} from 'rxjs';
import {storedUserId} from '../../iam/infrastructure/token-storage';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {PLATFORM_API_ENABLED} from '../../shared/infrastructure/platform-api';
import {ProfilesApiEndpoint} from './profiles-api-endpoint';

/** Expiration thresholds kept in the profile of the signed-in user. */
export interface ExpirationPreferences {
  criticalDays: number;
  riskDays: number;
}

@Injectable({providedIn: 'root'})
/**
 * Infrastructure gateway to the profiles bounded context of the OrganiK Platform.
 *
 * @remarks
 * The expiration thresholds of the settings are the preferences of the profile of the
 * signed-in user (`criticalExpirationDays` and `warningExpirationDays`). When
 * {@link PLATFORM_API_ENABLED} is off (unit tests), there is no profile to read or update.
 */
export class ProfilesApi extends BaseApi {
  private readonly http = inject(HttpClient);
  private readonly platformEnabled = inject(PLATFORM_API_ENABLED);
  private readonly profilesEndpoint = new ProfilesApiEndpoint(this.http);

  /**
   * Fetches the expiration thresholds of the signed-in user.
   *
   * @returns The thresholds, or `null` when nobody is signed in on the platform.
   */
  getExpirationPreferences(): Observable<ExpirationPreferences | null> {
    const userId = storedUserId();
    if (!this.platformEnabled || userId === null) {
      return of(null);
    }
    return this.profilesEndpoint.getByUserId(userId).pipe(
      map(([profile]) => (profile ? {criticalDays: profile.criticalExpirationDays, riskDays: profile.warningExpirationDays} : null))
    );
  }

  /**
   * Stores the expiration thresholds in the profile of the signed-in user.
   *
   * @param preferences - New thresholds.
   */
  saveExpirationPreferences(preferences: ExpirationPreferences): Observable<void> {
    const userId = storedUserId();
    if (!this.platformEnabled || userId === null) {
      return of(undefined);
    }
    return this.profilesEndpoint.getByUserId(userId).pipe(
      switchMap(([profile]) =>
        profile
          ? this.profilesEndpoint.updatePreferences(profile.id, {
              language: profile.language,
              warningExpirationDays: preferences.riskDays,
              criticalExpirationDays: preferences.criticalDays
            })
          : of(null)
      ),
      map(() => undefined)
    );
  }
}
