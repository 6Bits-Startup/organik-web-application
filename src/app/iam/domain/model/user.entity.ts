import {BaseEntity} from '../../../shared/domain/model/base-entity';
import {DomainError} from '../../../shared/domain/model/domain-error';
import {EmailAddress} from '../../../shared/domain/model/email-address';
import {ModuleKey, Role} from './role';

/** Whether the person already accepted the invitation to use OrganiK. */
export type UserStatus = 'accepted' | 'pending';

/**
 * Data required to build a {@link User}.
 */
export interface UserProps {
  id: number;
  fullName: string;
  email: EmailAddress;
  role: Role;
  assignedModule: ModuleKey;
  status: UserStatus;
  notes: string;
  /** Minimarket the user works for; empty for suppliers. */
  minimarketId?: string;
  /** Supplier company the user works for; `null` for the people of a minimarket. */
  supplierId?: string | null;
  /** Plan chosen when the user signed up. */
  plan?: string;
}

/**
 * Represents a person who can sign in to OrganiK with a role.
 */
export class User implements BaseEntity {
  #id: number;
  #fullName: string;
  #email: EmailAddress;
  #role: Role;
  #assignedModule: ModuleKey;
  #status: UserStatus;
  #notes: string;
  #minimarketId: string;
  #supplierId: string | null;
  #plan: string;

  /**
   * Creates a new user entity.
   * @param props - Initialization values.
   * @throws DomainError if the identifier or the name is blank, or the role cannot access the assigned module.
   */
  constructor(props: UserProps) {
    if (!Number.isInteger(props.id) || props.id <= 0 || !props.fullName.trim()) {
      throw new DomainError('A user needs an identifier and a full name');
    }
    if (props.role.accessTo(props.assignedModule) === 'none') {
      throw new DomainError(`The role ${props.role.id} cannot access ${props.assignedModule}`);
    }
    this.#id = props.id;
    this.#fullName = props.fullName.trim();
    this.#email = props.email;
    this.#role = props.role;
    this.#assignedModule = props.assignedModule;
    this.#status = props.status;
    this.#notes = props.notes.trim();
    this.#minimarketId = props.minimarketId ?? '';
    this.#supplierId = props.supplierId ?? null;
    this.#plan = props.plan ?? '';
  }

  /**
   * Gets the ID of the user.
   * @returns The ID.
   */
  get id(): number {
    return this.#id;
  }

  /**
   * Sets the ID of the user.
   * @param value The new ID.
   */
  set id(value: number) {
    this.#id = value;
  }

  /**
   * Gets the full name of the user.
   * @returns The full name.
   */
  get fullName(): string {
    return this.#fullName;
  }

  /**
   * Sets the full name of the user.
   * @param value The new full name.
   */
  set fullName(value: string) {
    this.#fullName = value;
  }

  /**
   * Gets the email address of the user.
   * @returns The email address.
   */
  get email(): EmailAddress {
    return this.#email;
  }

  /**
   * Sets the email address of the user.
   * @param value The new email address.
   */
  set email(value: EmailAddress) {
    this.#email = value;
  }

  /**
   * Gets the role of the user.
   * @returns The role.
   */
  get role(): Role {
    return this.#role;
  }

  /**
   * Sets the role of the user.
   * @param value The new role.
   */
  set role(value: Role) {
    this.#role = value;
  }

  /**
   * Gets the module the user lands on and works with the most.
   * @returns The assigned module.
   */
  get assignedModule(): ModuleKey {
    return this.#assignedModule;
  }

  /**
   * Sets the module the user lands on and works with the most.
   * @param value The new assigned module.
   */
  set assignedModule(value: ModuleKey) {
    this.#assignedModule = value;
  }

  /**
   * Gets whether the user already accepted the invitation.
   * @returns The status.
   */
  get status(): UserStatus {
    return this.#status;
  }

  /**
   * Sets whether the user already accepted the invitation.
   * @param value The new status.
   */
  set status(value: UserStatus) {
    this.#status = value;
  }

  /**
   * Gets the notes about the user.
   * @returns The notes.
   */
  get notes(): string {
    return this.#notes;
  }

  /**
   * Sets the notes about the user.
   * @param value The new notes.
   */
  set notes(value: string) {
    this.#notes = value;
  }

  /**
   * Gets the minimarket the user works for; empty for suppliers.
   * @returns The minimarket ID.
   */
  get minimarketId(): string {
    return this.#minimarketId;
  }

  /**
   * Sets the minimarket the user works for.
   * @param value The new minimarket ID.
   */
  set minimarketId(value: string) {
    this.#minimarketId = value;
  }

  /**
   * Gets the supplier company the user works for; `null` for the people of a minimarket.
   * @returns The supplier ID.
   */
  get supplierId(): string | null {
    return this.#supplierId;
  }

  /**
   * Sets the supplier company the user works for.
   * @param value The new supplier ID.
   */
  set supplierId(value: string | null) {
    this.#supplierId = value;
  }

  /**
   * Gets the plan chosen when the user signed up.
   * @returns The plan.
   */
  get plan(): string {
    return this.#plan;
  }

  /**
   * Sets the plan chosen when the user signed up.
   * @param value The new plan.
   */
  set plan(value: string) {
    this.#plan = value;
  }

  /** Whether the user can accept or reject the orders addressed to their minimarket. */
  get canDecideOrders(): boolean {
    return this.#role.id === 'administrator' && this.#minimarketId !== '';
  }

  /** Whether the user is still waiting to accept the invitation, so it can be sent again. */
  get canResendInvitation(): boolean {
    return this.#status === 'pending';
  }

  /**
   * Returns the user with other values for the editable fields.
   *
   * @param changes - Fields to replace.
   * @throws DomainError if the result violates an invariant.
   */
  with(changes: Partial<Omit<UserProps, 'id'>>): User {
    return new User({
      id: this.#id,
      fullName: this.#fullName,
      email: this.#email,
      role: this.#role,
      assignedModule: this.#assignedModule,
      status: this.#status,
      notes: this.#notes,
      minimarketId: this.#minimarketId,
      supplierId: this.#supplierId,
      plan: this.#plan,
      ...changes
    });
  }
}
