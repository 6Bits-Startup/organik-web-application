/**
 * Development environment configuration.
 */
export const environment = {
  production: false,
  /** Simulated latency (ms) applied by the in-memory gateways. */
  apiLatencyMs: 250,
  /** Language used when the user has not chosen one yet. */
  defaultLanguage: 'en',
  /** Base URL of the OrganiK Platform RESTful API. */
  platformProviderApiBaseUrl: 'http://localhost:8080/api/v1',
  platformProviderSignInEndpointPath: '/tokens',
  platformProviderSignUpEndpointPath: '/users',
  platformProviderUsersEndpointPath: '/users',
  platformProviderProfilesEndpointPath: '/profiles',
  platformProviderCategoriesEndpointPath: '/categories',
  platformProviderProductsEndpointPath: '/products',
  platformProviderSuppliersEndpointPath: '/suppliers',
  platformProviderOfferedProductsEndpointPath: '/offered-products',
  platformProviderStockLotsEndpointPath: '/stock-lots',
  platformProviderInventoryMovementsEndpointPath: '/inventory-movements',
  platformProviderOffersEndpointPath: '/offers',
  platformProviderSupplyRequestsEndpointPath: '/supply-requests',
  platformProviderShipmentOrdersEndpointPath: '/shipment-orders',
  platformProviderStorageZonesEndpointPath: '/storage-zones',
  platformProviderStorageReadingsEndpointPath: '/storage-readings',
  platformProviderOperationalIndicatorsEndpointPath: '/operational-indicators',
  platformProviderActivityRecordsEndpointPath: '/activity-records',
  platformProviderNotificationsEndpointPath: '/notifications',
  /** Public marketing site of OrganiK that links to this application. */
  landingUrl: 'http://localhost:5500/'
};
