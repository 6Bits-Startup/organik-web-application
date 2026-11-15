import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

/**
 * Profile returned by the OrganiK Platform: personal data and preferences of an IAM user.
 */
export interface ProfileResource extends BaseResource {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  minimarketId: string | null;
  supplierId: string | null;
  language: string;
  warningExpirationDays: number;
  criticalExpirationDays: number;
}

export interface ProfileResponse extends BaseResponse, ProfileResource {}
