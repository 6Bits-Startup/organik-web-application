/**
 * Request body of `PUT /profiles/{profileId}/preferences`.
 */
export interface UpdateProfilePreferencesRequest {
  language: string;
  warningExpirationDays: number;
  criticalExpirationDays: number;
}
