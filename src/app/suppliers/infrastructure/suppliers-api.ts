import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {forkJoin, map, Observable, of, switchMap} from 'rxjs';
import {Clock} from '../../shared/domain/services/clock';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {respondWith} from '../../shared/infrastructure/in-memory-gateway';
import {PLATFORM_API_ENABLED} from '../../shared/infrastructure/platform-api';
import {OfferedProduct} from '../domain/model/offered-product.entity';
import {Supplier} from '../domain/model/supplier.entity';
import {OfferedProductAssembler} from './offered-product-assembler';
import {OfferedProductsApiEndpoint} from './offered-products-api-endpoint';
import {SupplierAssembler} from './supplier-assembler';
import {SupplierCategoryAssembler} from './supplier-category-assembler';
import {PlatformOfferedProductResource, PlatformSupplierResource} from './supplier-platform-response';
import {OfferedProductResource, SupplierResource, SuppliersResponse} from './suppliers-response';
import {SuppliersApiEndpoint} from './suppliers-api-endpoint';
import {offeredProductsSeed, SUPPLIERS_SEED} from './suppliers-seed';

@Injectable({providedIn: 'root'})
/**
 * Infrastructure gateway to the suppliers bounded context of the OrganiK Platform.
 *
 * @remarks
 * The platform identifies suppliers by number; the web application uses that number as text.
 * The platform does not change an offered product once it is published, so an update stays in
 * this session. When {@link PLATFORM_API_ENABLED} is off (unit tests), resources are kept in memory.
 */
export class SuppliersApi extends BaseApi {
  private readonly http = inject(HttpClient);
  private readonly platformEnabled = inject(PLATFORM_API_ENABLED);
  private readonly assembler = inject(SupplierAssembler);
  private readonly offeredAssembler = inject(OfferedProductAssembler);
  private readonly suppliersEndpoint = new SuppliersApiEndpoint(this.http);
  private readonly offeredProductsEndpoint = new OfferedProductsApiEndpoint(this.http);
  private readonly today = inject(Clock).today();
  private readonly resources: SupplierResource[] = this.platformEnabled ? [] : structuredClone(SUPPLIERS_SEED);
  private readonly offeredResources: OfferedProductResource[] = this.platformEnabled ? [] : offeredProductsSeed(this.today);

  /**
   * Fetches every supplier and maps it into domain entities.
   */
  getSuppliers(): Observable<Supplier[]> {
    if (!this.platformEnabled) {
      const response: SuppliersResponse = {suppliers: structuredClone(this.resources)};
      return respondWith(response).pipe(map(r => this.assembler.toEntitiesFromResponse(r)));
    }
    return this.suppliersEndpoint.getAll().pipe(
      map(suppliers => this.assembler.toEntitiesFromResponse({suppliers: suppliers.map(supplier => this.toResourceFromPlatform(supplier))}))
    );
  }

  /**
   * Persists a new supplier.
   *
   * @param supplier - Supplier entity to store.
   */
  createSupplier(supplier: Supplier): Observable<Supplier> {
    if (!this.platformEnabled) {
      this.resources.push(this.assembler.toResourceFromEntity(supplier));
      return respondWith(supplier);
    }
    return this.suppliersEndpoint
      .create({
        businessName: supplier.businessName,
        contactName: supplier.contactName,
        phoneNumber: supplier.phone,
        email: supplier.email.toString(),
        categories: SupplierCategoryAssembler.toPlatformCategories(supplier.categories),
        organicCertification: supplier.organicCertification
      })
      .pipe(map(created => this.assembler.toEntityFromResource(this.toResourceFromPlatform(created))));
  }

  /**
   * Fetches every product the suppliers offer.
   */
  getOfferedProducts(): Observable<OfferedProduct[]> {
    if (!this.platformEnabled) {
      return respondWith({offeredProducts: structuredClone(this.offeredResources)}).pipe(
        map(response => this.offeredAssembler.toEntitiesFromResponse(response))
      );
    }
    return this.suppliersEndpoint.getAll().pipe(
      switchMap(suppliers =>
        suppliers.length ? forkJoin(suppliers.map(supplier => this.offeredProductsEndpoint.getBySupplierId(String(supplier.id)))) : of([])
      ),
      map(offered => {
        const published = offered.flat().map(product => this.toOfferedResourceFromPlatform(product));
        const revised = published.map(product => this.offeredResources.find(candidate => candidate.id === product.id) ?? product);
        return this.offeredAssembler.toEntitiesFromResponse({offeredProducts: revised});
      })
    );
  }

  /**
   * Persists a new offered product.
   *
   * @param offered - Entity to store.
   */
  createOfferedProduct(offered: OfferedProduct): Observable<OfferedProduct> {
    if (!this.platformEnabled) {
      this.offeredResources.push(this.offeredAssembler.toResourceFromEntity(offered));
      return respondWith(offered);
    }
    return this.offeredProductsEndpoint
      .create({
        supplierId: offered.supplierId,
        productId: offered.productId,
        lotCode: offered.lotCode,
        availableQuantity: offered.availableQuantity.value,
        expiresOn: offered.expiresOn.toString()
      })
      .pipe(map(created => this.offeredAssembler.toEntityFromResource(this.toOfferedResourceFromPlatform(created))));
  }

  /**
   * Replaces the stored version of an offered product.
   *
   * @param offered - Updated entity.
   */
  updateOfferedProduct(offered: OfferedProduct): Observable<OfferedProduct> {
    const resource = this.offeredAssembler.toResourceFromEntity(offered);
    const index = this.offeredResources.findIndex(candidate => candidate.id === offered.id);
    if (index < 0) {
      this.offeredResources.push(resource);
    } else {
      this.offeredResources[index] = resource;
    }
    return respondWith(offered);
  }

  private toResourceFromPlatform(supplier: PlatformSupplierResource): SupplierResource {
    return {
      id: String(supplier.id),
      businessName: supplier.businessName,
      contactName: supplier.contactName,
      phone: supplier.phoneNumber,
      email: supplier.email,
      categories: SupplierCategoryAssembler.toLabels(supplier.categories),
      organicCertification: supplier.organicCertification,
      specialties: []
    };
  }

  private toOfferedResourceFromPlatform(offered: PlatformOfferedProductResource): OfferedProductResource {
    return {
      id: String(offered.id),
      supplierId: offered.supplierId,
      productId: offered.productId,
      lotCode: offered.lotCode,
      availableQuantity: offered.availableQuantity,
      expiresOn: offered.expiresOn,
      updatedOn: this.today.toString()
    };
  }
}
