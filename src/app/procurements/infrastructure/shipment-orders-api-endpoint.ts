import {HttpClient} from '@angular/common/http';
import {catchError, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ErrorHandlingEnabledBaseType} from '../../shared/infrastructure/error-handling-enabled-base-type';
import {platformUrl} from '../../shared/infrastructure/platform-api';
import {sessionScopeParams} from '../../shared/infrastructure/session-scope';
import {CreateShipmentOrderRequest, PlatformShipmentOrderResource} from './shipment-order-platform-response';

const shipmentOrdersApiEndpointUrl = platformUrl(environment.platformProviderShipmentOrdersEndpointPath);

/**
 * Endpoint that reads, creates and decides the shipment orders of the OrganiK Platform.
 */
export class ShipmentOrdersApiEndpoint extends ErrorHandlingEnabledBaseType {
  constructor(private http: HttpClient) {
    super();
  }

  getForSession = (): Observable<PlatformShipmentOrderResource[]> =>
    this.http.get<PlatformShipmentOrderResource[]>(shipmentOrdersApiEndpointUrl, {params: sessionScopeParams()})
      .pipe(catchError(this.handleError('Failed to fetch shipment orders')));

  create = (request: CreateShipmentOrderRequest): Observable<PlatformShipmentOrderResource> =>
    this.http.post<PlatformShipmentOrderResource>(shipmentOrdersApiEndpointUrl, request)
      .pipe(catchError(this.handleError('Failed to create shipment order')));

  accept = (shipmentOrderId: number, decidedBy: number): Observable<PlatformShipmentOrderResource> =>
    this.http.post<PlatformShipmentOrderResource>(`${shipmentOrdersApiEndpointUrl}/${shipmentOrderId}/acceptances`, {decidedBy})
      .pipe(catchError(this.handleError('Failed to accept shipment order')));

  reject = (shipmentOrderId: number, decidedBy: number, reason: string): Observable<PlatformShipmentOrderResource> =>
    this.http.post<PlatformShipmentOrderResource>(`${shipmentOrdersApiEndpointUrl}/${shipmentOrderId}/rejections`, {decidedBy, reason})
      .pipe(catchError(this.handleError('Failed to reject shipment order')));
}
