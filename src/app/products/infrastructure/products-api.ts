import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {forkJoin, map, Observable} from 'rxjs';
import {BaseApi} from '../../shared/infrastructure/base-api';
import {respondWith} from '../../shared/infrastructure/in-memory-gateway';
import {PLATFORM_API_ENABLED} from '../../shared/infrastructure/platform-api';
import {Product} from '../domain/model/product.entity';
import {ProductCategory} from '../domain/model/product-category';
import {CategoriesApiEndpoint} from './categories-api-endpoint';
import {CategoryAssembler} from './category-assembler';
import {ProductAssembler} from './product-assembler';
import {CreateProductRequest, PlatformCategoryResource, PlatformProductResource} from './product-platform-response';
import {ProductsApiEndpoint} from './products-api-endpoint';
import {ProductResource} from './products-response';
import {CATEGORIES_SEED, PRODUCTS_SEED} from './products-seed';

/** Storage condition the web application shows for the products of each category. */
const STORAGE_CONDITIONS_BY_CATEGORY: Readonly<Record<string, string>> = {
  dairy: 'cold',
  frozen: 'frozen',
  grains: 'dry',
  bakery: 'dry',
  beverages: 'dry'
};

@Injectable({providedIn: 'root'})
/**
 * Infrastructure gateway to the products bounded context of the OrganiK Platform.
 *
 * @remarks
 * The web application identifies products by SKU and categories by name; the platform
 * identifies both by number. The gateway keeps the last categories and products it read to
 * translate one into the other. When {@link PLATFORM_API_ENABLED} is off (unit tests),
 * resources are kept in memory.
 */
export class ProductsApi extends BaseApi {
  private readonly http = inject(HttpClient);
  private readonly platformEnabled = inject(PLATFORM_API_ENABLED);
  private readonly categoryAssembler = inject(CategoryAssembler);
  private readonly productAssembler = inject(ProductAssembler);
  private readonly categoriesEndpoint = new CategoriesApiEndpoint(this.http);
  private readonly productsEndpoint = new ProductsApiEndpoint(this.http);
  private readonly productResources: ProductResource[] = structuredClone(PRODUCTS_SEED);
  private platformCategories: PlatformCategoryResource[] = [];
  private platformProducts: PlatformProductResource[] = [];

  /**
   * Fetches every product category.
   */
  getCategories(): Observable<ProductCategory[]> {
    if (!this.platformEnabled) {
      return respondWith({categories: structuredClone(CATEGORIES_SEED)}).pipe(
        map(response => this.categoryAssembler.toEntitiesFromResponse(response))
      );
    }
    return this.categoriesEndpoint.getAll().pipe(
      map(categories => {
        this.platformCategories = categories;
        return this.categoryAssembler.toEntitiesFromResponse({
          categories: categories.map(category => ({id: category.name, tone: category.tone.toLowerCase()}))
        });
      })
    );
  }

  /**
   * Fetches every product of the catalog.
   */
  getProducts(): Observable<Product[]> {
    if (!this.platformEnabled) {
      return respondWith({products: structuredClone(this.productResources)}).pipe(
        map(response => this.productAssembler.toEntitiesFromResponse(response))
      );
    }
    return forkJoin([this.categoriesEndpoint.getAll(), this.productsEndpoint.getAll()]).pipe(
      map(([categories, products]) => {
        this.platformCategories = categories;
        this.platformProducts = products;
        return this.productAssembler.toEntitiesFromResponse({
          products: products.map(product => this.toResourceFromPlatform(product))
        });
      })
    );
  }

  /**
   * Replaces the stored version of a product.
   *
   * @param product - Updated product entity.
   */
  updateProduct(product: Product): Observable<Product> {
    if (!this.platformEnabled) {
      const index = this.productResources.findIndex(resource => resource.id === product.id);
      this.productResources[index] = this.productAssembler.toResourceFromEntity(product);
      return respondWith(product);
    }
    const stored = this.platformProducts.find(candidate => candidate.sku === product.id);
    if (!stored) {
      throw new Error(`Product ${product.id} is not registered in the platform`);
    }
    const {name, categoryId, supplierId, unit, minimumStock} = this.toPlatformRequest(product);
    return this.productsEndpoint
      .update(stored.id, {name, categoryId, supplierId, unit, minimumStock})
      .pipe(map(updated => this.remember(updated)));
  }

  /**
   * Persists a new product.
   *
   * @param product - Product entity to store.
   */
  createProduct(product: Product): Observable<Product> {
    if (!this.platformEnabled) {
      this.productResources.push(this.productAssembler.toResourceFromEntity(product));
      return respondWith(product);
    }
    return this.productsEndpoint.create(this.toPlatformRequest(product)).pipe(map(created => this.remember(created)));
  }

  private remember(product: PlatformProductResource): Product {
    this.platformProducts = [...this.platformProducts.filter(candidate => candidate.id !== product.id), product];
    return this.productAssembler.toEntityFromResource(this.toResourceFromPlatform(product));
  }

  private toResourceFromPlatform(product: PlatformProductResource): ProductResource {
    const categoryName = this.platformCategories.find(category => category.id === product.categoryId)?.name ?? '';
    return {
      id: product.sku,
      name: product.name,
      categoryId: categoryName,
      supplierId: product.supplierId ?? '',
      unit: product.unit.toLowerCase(),
      minimumStock: product.minimumStock,
      storageCondition: STORAGE_CONDITIONS_BY_CATEGORY[categoryName] ?? 'fresh'
    };
  }

  private toPlatformRequest(product: Product): CreateProductRequest {
    const category = this.platformCategories.find(candidate => candidate.name === product.categoryId);
    if (!category) {
      throw new Error(`Category ${product.categoryId} is not registered in the platform`);
    }
    return {
      sku: product.id,
      name: product.name,
      categoryId: category.id,
      supplierId: product.supplierId || null,
      unit: product.unit.toUpperCase(),
      minimumStock: product.minimumStock.value
    };
  }
}
