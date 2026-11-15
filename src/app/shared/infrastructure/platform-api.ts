import {InjectionToken} from '@angular/core';
import {environment} from '../../../environments/environment';

/**
 * Switch that connects the gateways to the OrganiK Platform RESTful API.
 *
 * @remarks
 * It is off by default so that unit tests keep working with the local seed data;
 * `app.config.ts` turns it on for the running application.
 */
export const PLATFORM_API_ENABLED = new InjectionToken<boolean>('PLATFORM_API_ENABLED', {factory: () => false});

/**
 * Builds the URL of an OrganiK Platform endpoint.
 *
 * @param endpointPath - Endpoint path configured in the environment, e.g. `/products`.
 * @returns The absolute endpoint URL.
 */
export const platformUrl = (endpointPath: string): string =>
  `${environment.platformProviderApiBaseUrl}${endpointPath}`;
