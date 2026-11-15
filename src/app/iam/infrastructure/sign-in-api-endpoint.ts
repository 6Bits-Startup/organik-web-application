import {HttpClient} from '@angular/common/http';
import {catchError, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ErrorHandlingEnabledBaseType} from '../../shared/infrastructure/error-handling-enabled-base-type';
import {platformUrl} from '../../shared/infrastructure/platform-api';
import {SignInRequest} from './sign-in.request';
import {SignInResource} from './sign-in-response';

const signInApiEndpointUrl = platformUrl(environment.platformProviderSignInEndpointPath);

/**
 * Endpoint that signs a user in and returns its JWT.
 */
export class SignInApiEndpoint extends ErrorHandlingEnabledBaseType {
  constructor(private http: HttpClient) {
    super();
  }

  signIn = (request: SignInRequest): Observable<SignInResource> =>
    this.http.post<SignInResource>(signInApiEndpointUrl, request).pipe(
      catchError(this.handleError('Failed to sign-in'))
    );
}
