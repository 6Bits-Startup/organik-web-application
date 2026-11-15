/**
 * Request body of `POST /users` (sign-up).
 */
export interface SignUpRequest {
  username: string;
  password: string;
  roles: string[];
}
