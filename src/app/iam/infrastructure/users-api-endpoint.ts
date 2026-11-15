import {HttpClient} from '@angular/common/http';
import {catchError, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ErrorHandlingEnabledBaseType} from '../../shared/infrastructure/error-handling-enabled-base-type';
import {platformUrl} from '../../shared/infrastructure/platform-api';
import {SignUpResource} from './sign-up-response';

const usersApiEndpointUrl = platformUrl(environment.platformProviderUsersEndpointPath);

/**
 * Endpoint that reads the users registered in the OrganiK Platform.
 */
export class UsersApiEndpoint extends ErrorHandlingEnabledBaseType {
  constructor(private http: HttpClient) {
    super();
  }

  getAll = (): Observable<SignUpResource[]> =>
    this.http.get<SignUpResource[]>(usersApiEndpointUrl).pipe(catchError(this.handleError('Failed to fetch users')));

  getById = (id: number): Observable<SignUpResource> =>
    this.http.get<SignUpResource>(`${usersApiEndpointUrl}/${id}`).pipe(catchError(this.handleError('Failed to fetch user')));
}
