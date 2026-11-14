/** Local storage key that keeps the JWT returned by the OrganiK Platform. */
export const TOKEN_STORAGE_KEY = 'token';

/** Local storage key that keeps the identifier of the signed-in user. */
export const USER_ID_STORAGE_KEY = 'userId';

/**
 * Stores the token and the identifier of the signed-in user.
 *
 * @param token - JWT returned by the sign-in endpoint.
 * @param userId - Identifier of the signed-in user.
 */
export const saveSession = (token: string, userId: number): void => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(USER_ID_STORAGE_KEY, String(userId));
};

/**
 * Removes the token and the identifier of the signed-in user.
 */
export const clearSession = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_ID_STORAGE_KEY);
  localStorage.removeItem(MINIMARKET_ID_STORAGE_KEY);
  localStorage.removeItem(SUPPLIER_ID_STORAGE_KEY);
};

/**
 * @returns The identifier of the signed-in user, or `null` when nobody is signed in.
 */
export const storedUserId = (): number | null => {
  const value = localStorage.getItem(USER_ID_STORAGE_KEY);
  return value ? Number(value) : null;
};

/** Local storage key that keeps the minimarket of the signed-in user. */
export const MINIMARKET_ID_STORAGE_KEY = 'minimarketId';

/** Local storage key that keeps the supplier of the signed-in user. */
export const SUPPLIER_ID_STORAGE_KEY = 'supplierId';

/**
 * Stores the minimarket and the supplier of the signed-in user, read from its profile.
 *
 * @param minimarketId - Minimarket the user works for; empty for suppliers.
 * @param supplierId - Supplier the user works for, or `null`.
 */
export const saveSessionContext = (minimarketId: string, supplierId: string | null): void => {
  localStorage.setItem(MINIMARKET_ID_STORAGE_KEY, minimarketId);
  localStorage.setItem(SUPPLIER_ID_STORAGE_KEY, supplierId ?? '');
};

/**
 * @returns The minimarket of the signed-in user, or an empty string.
 */
export const storedMinimarketId = (): string => localStorage.getItem(MINIMARKET_ID_STORAGE_KEY) ?? '';

/**
 * @returns The supplier of the signed-in user, or an empty string.
 */
export const storedSupplierId = (): string => localStorage.getItem(SUPPLIER_ID_STORAGE_KEY) ?? '';
