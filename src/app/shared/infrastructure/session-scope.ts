import {HttpParams} from '@angular/common/http';
import {storedMinimarketId, storedSupplierId} from '../../iam/infrastructure/token-storage';

/**
 * Query parameters that limit a collection to the signed-in user: suppliers see what belongs to
 * their company and the minimarket staff what belongs to their minimarket.
 *
 * @returns `supplierId` or `minimarketId` of the signed-in user.
 */
export const sessionScopeParams = (): HttpParams => {
  const supplierId = storedSupplierId();
  return supplierId ? new HttpParams().set('supplierId', supplierId) : new HttpParams().set('minimarketId', storedMinimarketId());
};
