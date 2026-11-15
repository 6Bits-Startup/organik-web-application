# Architectural Decision Records (ADRs)

This document records the principal architectural decisions made for the OrganiK web application.

---

## ADR 001: Adoption of Domain-Driven Design (DDD) with One Folder per Bounded Context

### Status
Accepted

### Context
OrganiK covers several business capabilities (inventory, product catalog, supply requests, shipments, supplier management, conservation monitoring, analytics, identity) that evolve at different speeds. The project report (chapter 4.6) defines twelve bounded contexts, and the code has to mirror them so the design and the implementation can be defended together.

### Decision
Structure the frontend according to Domain-Driven Design tactical patterns, with **one folder per bounded context** under `src/app/`:
- **Bounded Contexts**: `iam`, `profiles`, `dashboard`, `analytics`, `inventory`, `products`, `requisition`, `procurements`, `suppliers`, `conservation`, `communication` and `shared` (Shared Kernel).
- **Layered Architecture per Context**, applying only the layers a context needs:
  - `domain`: entities, value objects and domain errors under `domain/model`, free from Angular, HTTP and UI dependencies.
  - `infrastructure`: gateways, assemblers, resource contracts and seeds that talk to the backend.
  - `application`: signal-based stores that orchestrate use cases and build read models.
  - `presentation`: standalone components, routed views, forms and the routes of the context.

### Consequences
- **Positive**: Clear boundaries between domains, features that are always found in the same place, isolated unit tests, and a direct match with the report.
- **Negative**: Additional boilerplate for mapping between layers, and contexts such as `profiles`, `dashboard` and `communication` currently own no domain model.

---

## ADR 002: Signal-Based State Management for Application Stores

### Status
Accepted

### Context
The views need fine-grained reactivity, predictable state mutations and minimal boilerplate, without adding a state-management library.

### Decision
Use lightweight, context-scoped stores (`InventoryStore`, `RequisitionStore`, `ProductsStore`, `AuthStore`, ...) powered by Angular Signals (`signal`, `computed`, `inject()`):
- Internal mutable state is kept private in a writable signal.
- Public state is exposed as read-only signals and computed read models.
- Stores are the only place that mutates state; views read signals and call store commands.
- Asynchronous gateway calls update the signals when they resolve.

### Consequences
- **Positive**: Integrates natively with zoneless change detection and `OnPush`; no external state library.
- **Negative**: Developers must follow the convention of immutable updates inside store methods.

---

## ADR 003: Assembler Pattern with Gateways That Return Domain Entities

### Status
Accepted

### Context
Backend resources differ from the internal domain model in naming, structure and types (for example dates travel as ISO strings and quantities as plain numbers).

### Decision
Each context keeps its wire contracts in `*-response.ts` files (`*Resource`, `*Response`) and maps them with dedicated assembler classes (`ProductAssembler`, `StockLotAssembler`, `SupplyRequestAssembler`, `ShipmentOrderAssembler`, `UserAssembler`, ...):
- Gateways (`ProductsApi`, `InventoryApi`, `RequisitionApi`, ...) return **domain entities**, never raw resources.
- Assemblers are bidirectional: resource to entity and entity to resource.
- Entities validate their invariants in the constructor and raise a `DomainError` when they are violated.

### Consequences
- **Positive**: The domain stays independent of backend schema changes, and the in-memory gateways can be replaced by HTTP ones without touching stores or views.
- **Negative**: One assembler per resource has to be written and tested.

---

## ADR 004: Value Objects and a Clock Port in the Shared Kernel

### Status
Accepted. The `Clock` port is superseded by ADR 012.

### Context
Quantities, money, percentages, e-mail addresses and dates appear in several contexts, and expiration rules depend on the current day, which makes tests fragile.

### Decision
Place reusable value objects (`CalendarDate`, `DateTime`, `EmailAddress`, `Money`, `Percentage`, `Quantity`) and the `Clock` port in `shared/domain`:
- Value objects are immutable and validate themselves.
- Time is always read through `Clock`, so tests can freeze the date.

### Consequences
- **Positive**: Consistent validation, no primitive obsession and deterministic expiration rules.
- **Negative**: Contexts depend on the Shared Kernel, so changes there must be reviewed carefully.

---

## ADR 005: Fake REST API on Beeceptor with a Local Fallback

### Status
Superseded by ADR 013.

### Context
The RESTful web services (Spring Boot) are developed in later sprints, while the frontend already has to be deployed and exercised against an API. The team uses the free plan of Beeceptor, which keeps about twelve objects in total (oldest first) and answers a limited number of requests per day.

### Decision
Expose three CRUD routes on Beeceptor under `https://organik.free.beeceptor.com/api/v1`: `/users` (sign in and sign up), `/products` and `/inventory`, documented in `docs/openapi-fake-api.yaml`. The `FakeApi` client in the Shared Kernel is **best effort**:
- Answers are cached for five minutes in memory and in `localStorage`, also when they failed.
- When the API is unreachable or out of quota (HTTP 429), the gateways keep working with their in-memory data.
- Remote objects are merged with the local seed, so no module becomes empty when the plan evicts old objects.
- The integration is switched on by the `FAKE_API_ENABLED` token in `app.config.ts`; unit tests stay in memory.

### Consequences
- **Positive**: The frontend can be deployed and demonstrated against a real HTTP API without the backend, and it never breaks when the free plan is exhausted.
- **Negative**: Data created by users is not durable on the free plan, and the demo passwords stored in the fake API are visible to anyone with the URL.

---

## ADR 006: Material Design 3 Theming with the OrganiK Palette

### Status
Accepted

### Context
The product needs an accessible, consistent UI component library whose look matches the OrganiK brand (forest greens with a lime accent) and the landing page.

### Decision
Adopt Angular Material with Material 3 theming:
- `@include mat.theme(...)` in `src/material-theme.scss` with the green and spring-green palettes, Geist as the interface font and Fraunces as the display font.
- `mat.theme-overrides` and component override mixins (buttons, form fields, tables, ...) for the OrganiK palette.
- Shared design tokens (`--ok-*`) in `src/styles.css` for surfaces, borders, shadows, motion and button variants.

### Consequences
- **Positive**: Accessible components, consistent look across views and one place to change the visual language.
- **Negative**: Requires familiarity with Material 3 token names and Sass mixin APIs.

---

## ADR 007: Standalone Components, Zoneless Change Detection and Lazy Routes

### Status
Accepted

### Context
Angular 22 favors standalone components, signals and zoneless change detection, and the initial bundle has a performance budget.

### Decision
- All components are standalone and declare their dependencies in `@Component.imports`.
- Change detection is zoneless with the default `OnPush` strategy.
- The shell layout and every context routes file are lazy loaded with `loadComponent` / `loadChildren`.
- Router features: component input binding, view transitions and anchor scrolling.

### Consequences
- **Positive**: Small initial bundle (about 360 kB), explicit dependencies and simpler testing.
- **Negative**: Each component must list its imports explicitly.

---

## ADR 008: Internationalization with `@ngx-translate` and English as the Default Language

### Status
Accepted

### Context
The course requires i18n in every product, with English (`en_US`) and Latin American Spanish as base languages and **English as the default** language of the interface.

### Decision
Use `@ngx-translate/core` and `@ngx-translate/http-loader` with `public/i18n/en.json` and `public/i18n/es.json`:
- `environment.defaultLanguage` is `en`, and English is also the fallback language.
- `LanguageStore` restores the language the user chose before and persists new choices.
- Templates use the `translate` pipe; no UI string is hardcoded.

### Consequences
- **Positive**: Runtime language switching without reloads and centralized translation keys.
- **Negative**: Translation files load asynchronously, so the first render waits for them.

---

## ADR 009: Authentication, Role-Based Access and Per-Tab Sessions

### Status
Accepted; the demonstration credentials are superseded by ADR 013 and the role permissions are revised by ADR 014.

### Context
Every module of the administrative frontend must be protected, and each role (administrator, operator, supplier) may only open the modules it is granted.

### Decision
- `authGuard` and `guestGuard` protect the routes; the requested URL is kept and restored after sign in.
- `moduleGuard` redirects to the dashboard when a role opens a module it cannot access, and the sidebar only lists the modules of the role (`Role.accessTo`).
- The session identifier lives in `sessionStorage`, so it ends with the browser tab.
- Sign up creates either a minimarket administrator or a supplier account.

### Consequences
- **Positive**: Least-privilege navigation and no leaked sessions between tabs.
- **Negative**: Credentials are demonstration-only until the identity backend exists; a real service must never expose passwords to the browser.

---

## ADR 010: Vitest for Unit Testing

### Status
Accepted; the `FakeApi` tests are superseded by ADR 013.

### Context
The domain model, the stores and the gateways need fast, deterministic unit tests that run without a browser.

### Decision
Use Vitest through the Angular `unit-test` builder (`ng test`) with `jsdom`:
- Domain entities and value objects are tested in isolation.
- Stores are tested with `TestBed`, a frozen system date (`vi.setSystemTime`) and fake timers for the simulated gateway latency.
- The `FakeApi` client is tested with `HttpTestingController`.

### Consequences
- **Positive**: Fast feedback and the same API as modern test runners.
- **Negative**: Component tests need jsdom, which does not implement every browser feature.

---

## ADR 011: Firebase Hosting with Separate Sites for the Landing Page and the Application

### Status
Accepted

### Context
The solution has two digital products with independent release cycles: the landing page (static HTML, CSS and JavaScript) and this Angular application.

### Decision
Deploy both to Firebase Hosting in the same project (`organik-d6e58`) as two sites:
- The landing page on `organik-d6e58`, and this application on `organik-app-d6e58`.
- The application serves `index.html` for every route (single-page application rewrite), caches hashed assets for a year and sends `X-Robots-Tag: noindex`.
- The landing page links to the application and the application links back to the landing page (`environment.landingUrl`).

### Consequences
- **Positive**: Free hosting, independent deployments and clear separation of the public and private areas.
- **Negative**: The two products must agree on their public addresses.

---

## ADR 012: No Domain Services; Derived Data Lives in Entities and Stores

### Status
Accepted. Supersedes the `Clock` port of ADR 004.

### Context
The reference repositories of the course keep the domain layer limited to `domain/model` (entities, commands and value objects) and compute derived data in the signal stores of the `application` layer. The project had three extra pieces under `domain/services`: `ConservationAlertService`, `SupplierSuggestionService` and an Angular `Clock` port, which was also the only file of the domain layer that imported Angular.

### Decision
- Remove the `domain/services` folders.
- Compute the conservation alerts and the supplier suggestions as `computed` signals in `ConservationStore` and `SuppliersStore`.
- Remove `Clock` and read the current day with `CalendarDate.today()`; the store specs freeze the date with `vi.setSystemTime`.
- Show the list tables with `MatTableDataSource`, `MatSort` and `MatPaginator`, read through `viewChild` as in the course examples.
- Use `provideRouter(routes)` without view transitions, anchor scrolling or component input binding (this supersedes the router features of ADR 007): the forms read route and query values with `ActivatedRoute`, and the module guard is a `CanActivateFn` kept in `iam/infrastructure/iam.guard.ts`.
- Build forms with `FormBuilder` and `FormControl`, validate formats and limits with `Validators.pattern`, `max` and `min` (their limits are updated when the field they depend on changes), and keep the rules that compare with today's date or with a list as short functions in the `validators` list.
- Fill the edit forms with a subscription to the route and to the load methods of the stores, which now return a stream that emits when the data is available, instead of an `effect`.
- Ask for the reason of a rejected order in a `MatDialog` (the `RejectOrder` component, opened with `MAT_DIALOG_DATA` as in the course `SourceSummary`), and use `mat-select` in every form select, show the days with `DatePipe` (`yyyy-MM-dd`), switch the fake API on from `environment` (the unit tests build with `environment.unit.ts`, whose address is empty) and restore the saved language and settings from the root component instead of an app initializer.

### Consequences
- **Positive**: The domain layer has no Angular imports and the structure matches the course repositories.
- **Negative**: The alert and suggestion rules are tested through their stores instead of in isolation, and time can only be controlled with the test runner timers.

---

## ADR 013: OrganiK Platform Backend through Endpoint Classes and Gateways

### Status
Accepted. Supersedes ADR 005.

### Context
The OrganiK Platform (Spring Boot, JWT) replaces the fake REST API. The course reference projects reach a backend through `BaseApi`, endpoint classes, `BaseResponse`/`BaseResource` contracts and an HTTP interceptor that adds the token.

### Decision
- Each resource of the backend has an endpoint class (`*-api-endpoint.ts`) that extends `ErrorHandlingEnabledBaseType`; its address is `platformProviderApiBaseUrl` plus `platformProvider<Resource>EndpointPath` of the environment.
- Each bounded context keeps one gateway (`*-api.ts`) that extends `BaseApi`, composes its endpoints with `new XApiEndpoint(this.http)` and maps the platform resources into the resources and assemblers it already had, so stores and views keep working with domain entities.
- `POST /tokens` returns the JWT; it is stored in `localStorage` with the user, minimarket and supplier of the profile, and `iamInterceptor` adds `Authorization: Bearer <token>` to every request.
- `PLATFORM_API_ENABLED` is `true` in `app.config.ts`; unit tests build with `environment.unit.ts`, leave the token off and use the in-memory seeds.
- `BaseEntity`, `BaseApiEndpoint`, `BaseAssembler` and `BaseResponse` of the course live in the Shared Kernel; `User` implements `BaseEntity` with numeric identifiers, as the platform does.
- The fake API client and `docs/openapi-fake-api.yaml` are removed; the API reference is the Scalar API Reference of the backend.

### Consequences
- **Positive**: Data is durable and shared by every user of a minimarket, and the passwords never reach the browser.
- **Negative**: The application needs the backend to run, and the gateways translate between the resources of the platform and those of the web application.

---

## ADR 014: Permissions per Role and Data of the Own Business

### Status
Accepted. Revises the role permissions of ADR 009.

### Context
The operator could open almost every module and the supplier could see the directory of other suppliers, while the report asks that each segment only sees and changes the data of its own business.

### Decision
- The operator manages inventory, waste and conservation and only follows products, requests and shipment orders; it no longer sees analytics, suppliers or catalogs, nor the orders that wait for a decision.
- The supplier follows the dashboard and the requests, manages its orders and catalog and does not see other suppliers.
- The users list reads the profiles of the minimarket of the signed-in user (`GET /profiles?minimarketId=`).
- The expiration thresholds belong to the minimarket: the administrator saves them in its profile and the platform applies them to every profile of the minimarket.
- Signing out reloads the application so the next user starts with empty stores.

### Consequences
- **Positive**: Each role sees what it needs, and every user of a minimarket classifies the lots with the same policy.
- **Negative**: The permissions are applied by the frontend; the backend only checks that the request is authenticated, as in the course reference projects.

---

## ADR 015: Conservation Forms, Notifications and Offers by Lot

### Status
Accepted

### Context
Storage zones, readings, notifications and offers existed in the platform but the web application could not create or use them.

### Decision
- Conservation offers a zone form (name and storage condition; the range comes from `ConservationRange.forCondition`) and a reading form for manual readings, following the list and form views of the course.
- The alerts view lists the notifications of the minimarket raised by the platform and marks them as read with `POST /notifications/{id}/readings`.
- An offer puts a lot on sale at a price from a start day to an end day, as the platform keeps it (`POST /offers`), instead of a number of units of a product.
- The location, notes and expiration date of a lot, the changes of a published catalog entry and the name of an edited user are saved with the `PUT` endpoints of the platform.

### Consequences
- **Positive**: The data typed in the application survives a reload and is shared with the other users of the minimarket.
- **Negative**: The role, assigned module and status of a user are still kept only in the browser session, because the platform does not change them.
