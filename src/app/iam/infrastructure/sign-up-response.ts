import {BaseResource, BaseResponse} from '../../shared/infrastructure/base-response';

/**
 * User returned by `POST /users` and `GET /users`.
 */
export interface SignUpResource extends BaseResource {
  id: number;
  username: string;
  roles: string[];
}

export interface SignUpResponse extends BaseResponse, SignUpResource {}
