import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {map, Observable} from 'rxjs';
import {CalendarDate} from '../../shared/domain/model/calendar-date';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {respondWith} from '../../shared/infrastructure/in-memory-gateway';
import {PLATFORM_API_ENABLED} from '../../shared/infrastructure/platform-api';
import {SupplyRequest} from '../domain/model/supply-request.entity';
import {SupplyRequestResource} from './requisition-response';
import {supplyRequestsSeed} from './requisition-seed';
import {SupplyRequestAssembler} from './supply-request-assembler';
import {PlatformSupplyRequestResource} from './supply-request-platform-response';
import {SupplyRequestsApiEndpoint} from './supply-requests-api-endpoint';

@Injectable({providedIn: 'root'})
/**
 * Infrastructure gateway to the requisition bounded context of the OrganiK Platform.
 *
 * @remarks
 * The minimarket staff read the requests of their minimarket and the suppliers the requests sent
 * to their company. When {@link PLATFORM_API_ENABLED} is off (unit tests), resources are kept in memory.
 */
export class RequisitionApi extends BaseApi {
  private readonly http = inject(HttpClient);
  private readonly platformEnabled = inject(PLATFORM_API_ENABLED);
  private readonly assembler = inject(SupplyRequestAssembler);
  private readonly supplyRequestsEndpoint = new SupplyRequestsApiEndpoint(this.http);
  private readonly resources: SupplyRequestResource[] = this.platformEnabled ? [] : supplyRequestsSeed(CalendarDate.today());

  /**
   * Fetches every supply request.
   */
  getSupplyRequests(): Observable<SupplyRequest[]> {
    if (!this.platformEnabled) {
      return respondWith({requests: structuredClone(this.resources)}).pipe(
        map(response => this.assembler.toEntitiesFromResponse(response))
      );
    }
    return this.supplyRequestsEndpoint.getForSession().pipe(
      map(requests => this.assembler.toEntitiesFromResponse({requests: requests.map(request => this.toResourceFromPlatform(request))}))
    );
  }

  /**
   * Persists a new supply request.
   *
   * @param request - Request entity to store.
   */
  createSupplyRequest(request: SupplyRequest): Observable<SupplyRequest> {
    const resource = this.assembler.toResourceFromEntity(request);
    if (!this.platformEnabled) {
      this.resources.push(resource);
      return respondWith(request);
    }
    return this.supplyRequestsEndpoint
      .create({
        productId: resource.productId,
        supplierId: resource.supplierId,
        minimarketId: resource.minimarketId,
        quantity: resource.quantity,
        reason: resource.reason,
        requiredDate: resource.requiredOn,
        priority: resource.priority.toUpperCase()
      })
      .pipe(map(created => this.assembler.toEntityFromResource(this.toResourceFromPlatform(created))));
  }

  private toResourceFromPlatform(request: PlatformSupplyRequestResource): SupplyRequestResource {
    return {
      id: String(request.id),
      productId: request.productId,
      supplierId: request.supplierId,
      minimarketId: request.minimarketId,
      quantity: request.quantity,
      reason: request.reason,
      requiredOn: request.requiredDate,
      priority: request.priority.toLowerCase(),
      status: request.status.toLowerCase()
    };
  }
}
