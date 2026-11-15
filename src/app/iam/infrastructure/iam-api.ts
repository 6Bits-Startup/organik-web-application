import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {catchError, defer, forkJoin, map, Observable, of, switchMap, throwError} from 'rxjs';
import {CreateProfileRequest} from '../../profiles/infrastructure/create-profile.request';
import {ProfilesApiEndpoint} from '../../profiles/infrastructure/profiles-api-endpoint';
import {ProfileResource} from '../../profiles/infrastructure/profiles-response';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {respondWith} from '../../shared/infrastructure/in-memory-gateway';
import {PLATFORM_API_ENABLED} from '../../shared/infrastructure/platform-api';
import {SupplierCategoryAssembler} from '../../suppliers/infrastructure/supplier-category-assembler';
import {SuppliersApiEndpoint} from '../../suppliers/infrastructure/suppliers-api-endpoint';
import {AuthenticationError} from '../domain/model/authentication-error';
import {Registration} from '../domain/model/registration';
import {RegistrationError} from '../domain/model/registration-error';
import {User} from '../domain/model/user.entity';
import {DEMO_ACCOUNTS, DEMO_PASSWORD} from './credentials-seed';
import {UserResource} from './iam-response';
import {USERS_SEED} from './iam-seed';
import {SignInApiEndpoint} from './sign-in-api-endpoint';
import {SignUpApiEndpoint} from './sign-up-api-endpoint';
import {SignUpResource} from './sign-up-response';
import {clearSession, saveSession, saveSessionContext, storedMinimarketId, storedUserId} from './token-storage';
import {UserAssembler} from './user-assembler';
import {UsersApiEndpoint} from './users-api-endpoint';

/** Browser storage key where the accounts created on this device are kept (local mode). */
const ACCOUNTS_KEY = 'organik.accounts';

/** An account created through the registration screen (local mode). */
interface StoredAccount {
  resource: UserResource;
  password: string;
}

/** Platform role of each web application role. */
const PLATFORM_ROLES: Readonly<Record<string, string>> = {
  administrator: 'ROLE_ADMINISTRATOR',
  operator: 'ROLE_OPERATOR',
  supplier: 'ROLE_SUPPLIER'
};

/** Module a user opens after signing in, by role. */
const DEFAULT_MODULES: Readonly<Record<string, string>> = {
  administrator: 'dashboard',
  operator: 'inventory',
  supplier: 'requests'
};

@Injectable({providedIn: 'root'})
/**
 * Infrastructure gateway to the identity and access management of the OrganiK Platform.
 *
 * @remarks
 * A user of the web application combines the IAM user (credentials and role) with its profile
 * (name, e-mail, minimarket or supplier). The JWT returned on sign-in is kept in `localStorage`
 * and added to every request by the IAM interceptor. When {@link PLATFORM_API_ENABLED} is off
 * (unit tests), the gateway works with the local seed instead.
 */
export class IamApi extends BaseApi {
  private readonly http = inject(HttpClient);
  private readonly platformEnabled = inject(PLATFORM_API_ENABLED);
  private readonly assembler = inject(UserAssembler);
  private readonly signInEndpoint = new SignInApiEndpoint(this.http);
  private readonly signUpEndpoint = new SignUpApiEndpoint(this.http);
  private readonly usersEndpoint = new UsersApiEndpoint(this.http);
  private readonly profilesEndpoint = new ProfilesApiEndpoint(this.http);
  private readonly suppliersEndpoint = new SuppliersApiEndpoint(this.http);
  private readonly resources: UserResource[] = structuredClone(USERS_SEED);
  private readonly passwords = new Map<string, string>(DEMO_ACCOUNTS.map(email => [email, DEMO_PASSWORD]));
  private cachedUsers: User[] = [];

  constructor() {
    super();
    for (const account of this.readAccounts()) {
      this.resources.push(account.resource);
      this.passwords.set(account.resource.email, account.password);
    }
  }

  /**
   * Fetches the users of the business of the signed-in user, each with its profile: the staff of
   * its minimarket or, for a supplier, only the supplier itself.
   */
  getUsers(): Observable<User[]> {
    if (!this.platformEnabled) {
      return respondWith({users: structuredClone(this.resources)}).pipe(
        map(response => this.assembler.toEntitiesFromResponse(response))
      );
    }
    const minimarketId = storedMinimarketId();
    const userId = storedUserId();
    const profiles$: Observable<ProfileResource[]> = minimarketId
      ? this.profilesEndpoint.getByMinimarketId(minimarketId)
      : userId !== null
        ? this.profilesEndpoint.getByUserId(userId)
        : of([]);
    return forkJoin([this.usersEndpoint.getAll(), profiles$]).pipe(
      map(([users, profiles]) =>
        users
          .filter(user => profiles.some(profile => profile.userId === user.id))
          .map(user => this.toUserFromPlatform(user, profiles.find(profile => profile.userId === user.id)))
          .filter((user): user is User => user !== null)
      ),
      map(users => (this.cachedUsers = users))
    );
  }

  /**
   * Invites a user. On the platform the user is registered with the demo password and its profile.
   *
   * @param user - User to create.
   */
  createUser(user: User): Observable<User> {
    if (!this.platformEnabled) {
      this.resources.push(this.assembler.toResourceFromEntity(user));
      return respondWith(user);
    }
    const email = user.email.toString();
    const creator = this.cachedUsers.find(candidate => candidate.id === String(storedUserId()));
    return this.signUpEndpoint
      .signUp({username: email, password: DEMO_PASSWORD, roles: [PLATFORM_ROLES[user.role.id]]})
      .pipe(
        switchMap(created =>
          this.profilesEndpoint
            .create({
              userId: created.id,
              fullName: user.fullName,
              email,
              minimarketId: user.role.id === 'supplier' ? null : creator?.minimarketId || null,
              supplierId: user.supplierId
            })
            .pipe(map(profile => this.toUserFromPlatform(created, profile) ?? user))
        )
      );
  }

  /**
   * Updates a user. The platform does not change roles or names yet, so the change stays in this session.
   *
   * @param user - Updated user.
   */
  updateUser(user: User): Observable<User> {
    if (!this.platformEnabled) {
      const index = this.resources.findIndex(resource => resource.id === user.id);
      this.resources[index] = this.assembler.toResourceFromEntity(user);
    }
    return respondWith(user);
  }

  /**
   * Signs a user in with its e-mail and password.
   *
   * @param email - E-mail used as username.
   * @param password - Password.
   * @returns The signed-in user.
   * @throws AuthenticationError when the credentials are wrong.
   */
  authenticate(email: string, password: string): Observable<User> {
    if (!this.platformEnabled) {
      return this.authenticateLocally(email, password);
    }
    return this.signInEndpoint.signIn({username: email.trim().toLowerCase(), password}).pipe(
      catchError(() => throwError(() => new AuthenticationError('invalid-credentials'))),
      switchMap(authenticated => {
        saveSession(authenticated.token, authenticated.id);
        return this.getUser(authenticated.id);
      })
    );
  }

  /**
   * Registers an administrator or a supplier, signs it in and creates its profile.
   * Suppliers also get their supplier record, which their profile references.
   *
   * @param registration - Data typed in the registration screen.
   * @throws RegistrationError when the e-mail is already registered.
   */
  register(registration: Registration): Observable<User> {
    if (!this.platformEnabled) {
      return this.registerLocally(registration);
    }
    const email = registration.email.trim().toLowerCase();
    const isSupplier = registration.role === 'supplier';
    return this.signUpEndpoint
      .signUp({username: email, password: registration.password, roles: [PLATFORM_ROLES[registration.role]]})
      .pipe(
        switchMap(() => this.signInEndpoint.signIn({username: email, password: registration.password})),
        switchMap(authenticated => {
          saveSession(authenticated.token, authenticated.id);
          const supplierId$: Observable<string | null> = isSupplier
            ? this.suppliersEndpoint
                .create({
                  businessName: registration.company.trim(),
                  contactName: registration.fullName.trim(),
                  phoneNumber: (registration.phone ?? '').trim(),
                  email,
                  categories: SupplierCategoryAssembler.toPlatformCategories((registration.categories ?? '').split(',')),
                  organicCertification: 'Pending verification'
                })
                .pipe(map(supplier => String(supplier.id)))
            : of(null);
          return supplierId$.pipe(
            switchMap(supplierId => {
              const request: CreateProfileRequest = {
                userId: authenticated.id,
                fullName: registration.fullName.trim(),
                email,
                minimarketId: isSupplier ? null : `mm-${authenticated.id}`,
                supplierId
              };
              return this.profilesEndpoint.create(request);
            }),
            switchMap(() => this.getUser(authenticated.id))
          );
        })
      );
  }

  /**
   * Signs the current user out.
   */
  signOut(): void {
    clearSession();
  }

  /**
   * Keeps the invitation flow of the local mode; the platform has no invitations yet.
   *
   * @param user - Invited user.
   */
  resendInvitation(user: User): Observable<User> {
    return respondWith(user);
  }

  private getUser(userId: number): Observable<User> {
    return forkJoin([this.usersEndpoint.getById(userId), this.profilesEndpoint.getByUserId(userId)]).pipe(
      map(([user, profiles]) => {
        const signedIn = this.toUserFromPlatform(user, profiles[0]);
        if (!signedIn) {
          throw new AuthenticationError('invalid-credentials');
        }
        this.cachedUsers = [...this.cachedUsers.filter(candidate => candidate.id !== signedIn.id), signedIn];
        saveSessionContext(signedIn.minimarketId, signedIn.supplierId);
        return signedIn;
      })
    );
  }

  private toUserFromPlatform(user: SignUpResource, profile: ProfileResource | undefined): User | null {
    const role = Object.keys(PLATFORM_ROLES).find(key => user.roles.includes(PLATFORM_ROLES[key])) ?? 'operator';
    const email = profile?.email ?? user.username;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return null;
    }
    return this.assembler.toEntityFromResource({
      id: String(user.id),
      fullName: profile?.fullName ?? user.username,
      email,
      role,
      assignedModule: DEFAULT_MODULES[role],
      status: 'accepted',
      notes: '',
      minimarketId: profile?.minimarketId ?? '',
      supplierId: profile?.supplierId ?? null
    });
  }

  private authenticateLocally(email: string, password: string): Observable<User> {
    return defer(() => {
      const normalized = email.trim().toLowerCase();
      const resource = this.resources.find(candidate => candidate.email === normalized);
      if (!resource || password !== this.passwords.get(normalized)) {
        return throwError(() => new AuthenticationError('invalid-credentials'));
      }
      return respondWith(resource).pipe(
        switchMap(found =>
          found.status === 'pending'
            ? throwError(() => new AuthenticationError('pending-invitation'))
            : respondWith(this.assembler.toEntityFromResource(found))
        )
      );
    });
  }

  private registerLocally(registration: Registration): Observable<User> {
    return defer(() => {
      const email = registration.email.trim().toLowerCase();
      if (this.resources.some(candidate => candidate.email === email)) {
        return throwError(() => new RegistrationError('email-taken'));
      }
      const id = this.nextUserId();
      const resource: UserResource = {
        id,
        fullName: registration.fullName.trim(),
        email,
        role: registration.role,
        assignedModule: registration.role === 'supplier' ? 'requests' : 'dashboard',
        status: 'accepted',
        notes: registration.company.trim(),
        minimarketId: registration.role === 'supplier' ? '' : `mm-${id}`,
        supplierId: registration.role === 'supplier' ? `sup-${id}` : null,
        plan: registration.plan ?? ''
      };
      this.resources.push(resource);
      this.passwords.set(email, registration.password);
      this.saveAccount({resource, password: registration.password});
      return respondWith(this.assembler.toEntityFromResource(resource));
    });
  }

  private nextUserId(): string {
    const highest = this.resources.reduce((max, {id}) => Math.max(max, Number(id.replace('usr-', '')) || 0), 0);
    return `usr-${highest + 1}`;
  }

  private readAccounts(): StoredAccount[] {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? '[]');
      return Array.isArray(stored) ? (stored as StoredAccount[]) : [];
    } catch {
      return [];
    }
  }

  private saveAccount(account: StoredAccount): void {
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...this.readAccounts(), account]));
    } catch {
      // Storage can be unavailable; the account still works during this session.
    }
  }
}

