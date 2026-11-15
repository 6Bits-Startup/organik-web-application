import {HttpInterceptorFn} from '@angular/common/http';
import {TOKEN_STORAGE_KEY} from './token-storage';

/**
 * Adds the JWT of the signed-in user to every request sent to the OrganiK Platform.
 *
 * @param request - Outgoing request.
 * @param next - Next handler of the chain.
 * @returns The handled request.
 */
export const iamInterceptor: HttpInterceptorFn = (request, next) => {
  // Get the token from local storage.
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  // If the token exists, add it to the request headers. Otherwise, send the request as is.
  const handledRequest = token
    ? request.clone({headers: request.headers.set('Authorization', `Bearer ${token}`)})
    : request;
  // Return the handled request.
  return next(handledRequest);
};
