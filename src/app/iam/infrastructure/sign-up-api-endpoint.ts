import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {catchError, Observable, throwError} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ErrorHandlingEnabledBaseType} from '../../shared/infrastructure/error-handling-enabled-base-type';
import {platformUrl} from '../../shared/infrastructure/platform-api';
import {RegistrationError} from '../domain/model/registration-error';
import {SignUpRequest} from './sign-up.request';
import {SignUpResource} from './sign-up-response';

const signUpApiEndpointUrl = platformUrl(environment.platformProviderSignUpEndpointPath);

/**
 * Endpoint that registers a user with its credentials and roles.
 */
export class SignUpApiEndpoint extends ErrorHandlingEnabledBaseType {
  constructor(private http: HttpClient) {
    super();
  }

  signUp = (request: SignUpRequest): Observable<SignUpResource> =>
    this.http.post<SignUpResource>(signUpApiEndpointUrl, request).pipe(
      catchError((error: HttpErrorResponse) =>
        error.status === 409 ? throwError(() => new RegistrationError('email-taken')) : this.handleError('Failed to sign-up')(error)
      )
    );
}
