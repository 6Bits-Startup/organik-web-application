# OrganiK Web Application (`organik-website-v2`)

## Overview
`organik-website-v2` is an Angular 22 client application for managing a minimarket that sells organic products. It lets the minimarket control its inventory, ask suppliers to replenish products, receive shipments, watch the conservation conditions of its storage zones and react to alerts before products are lost. Suppliers can follow the requests and shipments addressed to them.

The codebase is organized around Domain-Driven Design (DDD) bounded contexts and layered responsibilities, following the twelve bounded contexts of the project report.

The application consumes the RESTful API of the [OrganiK Platform](https://github.com/6Bits-Startup/organik-platform) backend (`http://localhost:8080/api/v1` when both run locally). Unit tests keep working with in-memory data. The marketing site lives in a separate repository, [`organik-frontend-v2`](https://github.com/5Bits-OrganiK/organik-frontend-v2).

- Application: https://organik-app-d6e58.web.app
- Landing page: https://organik-d6e58.web.app

## Features
- Operational dashboard with health, key figures, recent activity and shortcuts
- Inventory of stock lots with expiration status (normal, at risk, critical), category and expiration filters, forms to register stock, edit lots, register waste and offers, lots per product and a history of movements
- Product catalog with categories, a product list, and forms to add (with initial quantity) and edit products
- Supplier catalog: suppliers publish their products with lot and availability, minimarkets consult it
- Supply requests shared by the minimarket (read-only for suppliers) and supplier orders that the administrator of the minimarket accepts or rejects with a reason
- Supplier directory, supplier profile, registration form and suggested suppliers for the active alerts
- Conservation monitoring of temperature and humidity per storage zone, with prioritized alerts
- Analytics, alert trend and a dependency-free PDF report generator
- Users, roles and access profiles with role-based navigation
- Sign in, sign up (minimarket or supplier) and per-tab sessions with route guards
- Signal-based state management and reactive UI updates (`signal`, `computed`)
- Material Design 3 styling with the OrganiK green palette (Geist and Fraunces typefaces)
- Internationalization with English (default) and Spanish resources using `@ngx-translate`
- HTTP communication with the OrganiK Platform through endpoint classes, `BaseApi` gateways, a JWT interceptor and the Assembler pattern
- Layered organization by bounded context:
  - `iam`, `profiles`, `dashboard`, `analytics`, `inventory`, `products`
  - `requisition`, `procurements`, `suppliers`, `conservation`, `communication`
  - `shared`

## Current Scope
The enabled routes (all protected by `authGuard` except `login` and `register`) are:
- `login`, `register`
- `dashboard`
- `inventory`, `inventory/stock/new`, `inventory/product/:productId`, `inventory/lots/:lotCode/edit`, `inventory/waste/new`, `inventory/offers/new`, `inventory/history`
- `products`, `products/list`, `products/new`, `products/:id/edit`
- `requests`, `requests/new`
- `shipments`, `shipments/new`, `shipments/:id`
- `catalog`, `catalog/new`, `catalog/:id/edit`
- `suppliers`, `suppliers/new`, `suppliers/suggested`, `suppliers/:id`
- `conservation`, `conservation/alerts`
- `analytics`, `analytics/report`, `alerts`
- `users`, `users/new`, `users/:id/edit`
- `profiles`, `settings`
- `prototype` (entry screen with the interaction map)

Each role only sees the modules it is granted: the administrator manages every module; the operator runs the daily operation (inventory, waste and conservation) and follows the products, requests and incoming orders without deciding on them; the supplier follows the dashboard and the requests, publishes its catalog and creates orders, and does not see other suppliers. Only the administrator of the destination minimarket accepts or rejects an order, and the users list only shows the people of the minimarket of the signed-in user. Create the accounts at `/register` (administrator or supplier); they are stored in the backend.

## Architecture Overview
The application structure follows Domain-Driven Design (DDD) bounded contexts, one folder each:

- **`iam`**: Identity and Access Management: authentication, sign up, users, roles, permissions and the signed-in session.
- **`profiles`**: Access profiles of the people and the business settings (language and expiration thresholds).
- **`dashboard`**: Read-only composition of figures from the other contexts.
- **`analytics`**: Operational indicators, alert trend and reports.
- **`inventory`**: Stock lots and their expiration policy.
- **`products`**: Product catalog and categories.
- **`requisition`**: Supply requests, the needs the minimarket shares with suppliers.
- **`procurements`**: Orders created by suppliers and their acceptance or rejection by the minimarket.
- **`suppliers`**: Supplier directory and recommendations.
- **`conservation`**: Storage zones, sensor readings and conservation alerts.
- **`communication`**: Alerts and notifications shown to the user.
- **`shared`**: Shared Kernel with value objects, the base API types, the shell layout and reusable UI parts.

Each bounded context applies the layers it needs from these four:
- **`domain`**: Entities and value objects under `domain/model`, free from Angular dependencies.
- **`application`**: Signal-based stores (`signal`, `computed`) that coordinate use cases and build read models.
- **`infrastructure`**: Gateways, resource contracts, assemblers and seeds that talk to the backend.
- **`presentation`**: Standalone components, routed views, forms and the routes of the context.

`profiles`, `dashboard` and `communication` own no domain model or backend gateway yet, so they only have `application` and `presentation`.

## Project Structure
The repository layout uses the following tree structure:

```text
organik-website-v2/
├── docs/                               # Architectural and requirement documentation
│   ├── adrs.md                         # Architectural Decision Records (ADRs)
│   ├── class-diagram.puml              # PlantUML domain and component class diagram
│   ├── openapi-fake-api.yaml           # OpenAPI specification of the fake REST API
│   └── user-stories.md                 # Functional user stories & Requirements Traceability Matrix (RTM)
├── public/                             # Static public assets
│   ├── favicon.ico                     # Application favicon
│   ├── favicon.svg                     # Brand mark
│   └── i18n/                           # Translation dictionaries for @ngx-translate
│       ├── en.json                     # English locale strings
│       └── es.json                     # Spanish locale strings
├── src/                                # Application source code
│   ├── index.html                      # Single-page HTML entry point
│   ├── main.ts                         # Application bootstrap entry point
│   ├── material-theme.scss             # Material 3 theme configuration & OrganiK palette
│   ├── styles.css                      # Global CSS: design tokens, motion and shared classes
│   ├── environments/                   # Build and runtime environment settings
│   │   ├── environment.ts              # Production environment configuration
│   │   └── environment.development.ts  # Local development environment configuration
│   └── app/                            # Application root and bounded contexts
│       ├── app.config.ts               # Application-level providers (router, i18n, http, IAM interceptor)
│       ├── app.routes.ts               # Root routing definitions and guards
│       ├── app.ts                      # Root component class
│       ├── iam/                        # Identity and Access Management
│       │   ├── domain/                 # User, Role, Registration and authentication errors
│       │   ├── infrastructure/         # IamApi, assembler and resources
│       │   ├── application/            # AuthStore, SessionStore, UsersStore
│       │   └── presentation/           # Login, register and user views
│       ├── profiles/                   # Profiles and business settings
│       │   ├── application/            # SettingsStore
│       │   └── presentation/           # Profile list and settings views
│       ├── dashboard/                  # Dashboard
│       │   ├── application/            # DashboardStore
│       │   └── presentation/           # Dashboard view
│       ├── analytics/                  # Analytics
│       │   ├── domain/                 # Indicators, alert trend, report request
│       │   ├── infrastructure/         # AnalyticsApi, PDF builder, exporter
│       │   ├── application/            # AnalyticsStore, ReportComposer
│       │   └── presentation/           # Overview, report form, trend chart
│       ├── inventory/                  # Inventory
│       │   ├── domain/                 # StockLot, ExpirationPolicy, StockStatus
│       │   ├── infrastructure/         # InventoryApi, assembler, resources
│       │   ├── application/            # InventoryStore
│       │   └── presentation/           # Inventory list and stock form
│       ├── products/                   # Products
│       │   ├── domain/                 # Product, ProductCategory
│       │   ├── infrastructure/         # ProductsApi, assemblers, resources
│       │   ├── application/            # ProductsStore
│       │   └── presentation/           # Categories and product form
│       ├── requisition/                # Requisition
│       │   ├── domain/                 # SupplyRequest
│       │   ├── infrastructure/         # RequisitionApi, assembler, resources
│       │   ├── application/            # RequisitionStore
│       │   └── presentation/           # Request list and form
│       ├── procurements/               # Procurements
│       │   ├── domain/                 # ShipmentOrder, ShipmentLine, OrderDecision
│       │   ├── infrastructure/         # ProcurementsApi, assembler, resources
│       │   ├── application/            # ProcurementsStore
│       │   └── presentation/           # Order list, form and detail
│       ├── suppliers/                  # Suppliers
│       │   ├── domain/                 # Supplier, SupplierSpecialty
│       │   ├── infrastructure/         # SuppliersApi, assembler, resources
│       │   ├── application/            # SuppliersStore
│       │   └── presentation/           # Directory, detail, form and suggestions
│       ├── conservation/               # Conservation
│       │   ├── domain/                 # StorageZone, ConservationRange, ConservationAlert
│       │   ├── infrastructure/         # ConservationApi, assemblers, resources
│       │   ├── application/            # ConservationStore
│       │   └── presentation/           # Monitoring and alerts views
│       ├── communication/              # Communication
│       │   ├── application/            # AlertsStore, Notifier
│       │   └── presentation/           # Alerts overview and alert item
│       └── shared/                     # Shared Kernel
│           ├── domain/                 # Value objects, DomainError
│           ├── infrastructure/         # FakeApi, in-memory gateway, page title strategy
│           ├── application/            # LanguageStore, PageTitleStore
│           └── presentation/           # Shell layout, sidebar, header, search, shared components
├── .editorconfig                       # Editor formatting rules
├── .firebaserc                         # Firebase project alias
├── .prettierrc                         # Prettier formatting rules
├── angular.json                        # Angular CLI workspace configuration
├── CHANGELOG.md                        # Project version release history
├── CONTRIBUTING.md                     # Architecture, Git Flow, and coding guidelines
├── firebase.json                       # Firebase Hosting configuration (SPA rewrite and headers)
├── LICENSE.md                          # Project license file
├── package.json                        # npm dependencies and project scripts
├── README.md                           # Main project documentation
├── tsconfig.json                       # Root TypeScript compiler options
├── tsconfig.app.json                   # Application compilation TypeScript options
└── tsconfig.spec.json                  # Unit testing compilation TypeScript options
```

## Technologies
- **Framework**: Angular 22 (Standalone Components, Signals, zoneless change detection, `inject()`)
- **Language**: TypeScript 6
- **UI & Theming**: Angular Material 22 and Angular CDK (Material 3 tokens, Sass theme config)
- **State & Reactivity**: Angular Signals & RxJS
- **Forms**: Angular Reactive Forms
- **Internationalization**: `@ngx-translate/core` & `@ngx-translate/http-loader`
- **Testing**: Vitest with jsdom (`ng test`)
- **Backend**: OrganiK Platform (Spring Boot RESTful API with JWT)
- **Hosting**: Firebase Hosting
- **Diagrams**: PlantUML

## Documentation
- **User Stories & Requirements Traceability**: [`docs/user-stories.md`](docs/user-stories.md) - Functional requirement specifications and RTM mapping.
- **Class Diagram**: [`docs/class-diagram.puml`](docs/class-diagram.puml) - PlantUML architectural model of bounded contexts, entities, and services.
- **Architectural Decision Records (ADRs)**: [`docs/adrs.md`](docs/adrs.md) - Key architectural and technology choices.
- **API Reference**: Scalar API Reference of the backend at `http://localhost:8080/scalar`.
- **Contributing Guidelines**: [`CONTRIBUTING.md`](CONTRIBUTING.md) - DDD layers, OOP rules, Git Flow, Conventional Commits, and coding standards.
- **Changelog**: [`CHANGELOG.md`](CHANGELOG.md) - Version history following Keep a Changelog and SemVer conventions.

## Prerequisites
Before running the project, make sure the environment includes:
- Node.js (v20+ recommended)
- npm
- The [OrganiK Platform](https://github.com/6Bits-Startup/organik-platform) backend running locally (Java 27, Maven Wrapper and MySQL)

## Installation
Install project dependencies from the project root:

```bash
npm install
```

## Running the Application
Start the Angular development server from the project root:

```bash
npm start
```

This starts the application at:

- `http://localhost:4200/`

## Running Frontend and Backend Locally
1. Clone both repositories in the same folder:

   ```bash
   git clone https://github.com/6Bits-Startup/organik-platform.git
   git clone https://github.com/6Bits-Startup/organik-web-application.git
   ```

2. Start MySQL (the `dev` profile creates the `organik-db` database) and run the backend from `organik-platform`:

   ```bash
   ./mvnw spring-boot:run
   ```

   The API answers at `http://localhost:8080/api/v1` and its documentation at `http://localhost:8080/scalar`. On start-up the backend seeds the roles and the default product categories.

3. Install the dependencies and run the frontend from `organik-web-application`:

   ```bash
   npm install
   npm start
   ```

4. Open `http://localhost:4200/register` and create a minimarket administrator; sign out and create a supplier (phone and categories are required for suppliers). Then sign in with those accounts.

The address of the backend is `platformProviderApiBaseUrl` in `src/environments/environment*.ts`, and each resource has its own `platformProvider<Resource>EndpointPath`. Change it before building for an environment that is not local.

## OrganiK Platform Integration
- Each bounded context has endpoint classes (`*-api-endpoint.ts`) that extend `ErrorHandlingEnabledBaseType` and a gateway (`*-api.ts`) that extends `BaseApi`, composes those endpoints and maps the platform resources into the existing resources and assemblers.
- `POST /tokens` returns the JWT; it is stored in `localStorage` (`token`) with the user identifier and the minimarket or supplier of the profile. `iamInterceptor` adds `Authorization: Bearer <token>` to every request.
- A web application user combines the IAM user (`/users`) with its profile (`/profiles`). Signing up creates the user, signs it in and creates its profile; suppliers also create their record in `/suppliers`.
- Minimarket staff read the data of their minimarket (`minimarketId`) and suppliers the data of their company (`supplierId`).
- A waste is sent as a `WASTE` inventory movement and a new quantity as an `ADJUSTMENT`; the history of the inventory is built from those movements.
- Accepting an order (`/shipment-orders/{id}/acceptances`) registers its lots in the backend, so the frontend reads the lots again.
- Storage zones, their readings and the notifications belong to a minimarket. Conservation has forms to create zones and record manual readings; the alerts screen lists the notifications raised by the platform and marks them as read.
- The location, notes and expiration date of a lot are updated with `PUT /stock-lots/{id}`, a published catalog entry with `PUT /offered-products/{id}` and the name of a user with `PUT /profiles/{id}`.
- An offer puts a lot on sale at a price from a start day to an end day (`POST /offers`).
- The expiration thresholds of the settings belong to the minimarket: the administrator saves them in its profile (`PUT /profiles/{id}/preferences`) and the platform applies them to every profile of the minimarket, including the users invited later.
- `PLATFORM_API_ENABLED` turns the integration on in `app.config.ts`; unit tests leave it off and use the in-memory seeds.

Known limitations of the current backend:
- The role, assigned module and status of a user are kept only in the browser session; the platform only updates the name.
- The storage condition of a product is derived from its category, and readings are per storage zone (not per product).
- The avoided loss of the analytics is 0 because the platform has no prices; the operational health is estimated from expired lots, lots about to expire and out-of-range readings.
- Users invited from `/users` get the temporary password `Organik2026!`.

## Available Scripts
From the project root, the following scripts are available:

- `npm start` - Starts the development server (`ng serve`).
- `npm run build` - Compiles and builds the production bundles (`ng build`).
- `npm run watch` - Builds the application in watch mode with development configuration.
- `npm test` - Executes unit tests with Vitest (`ng test`).

## Deployment
The production bundle is deployed to Firebase Hosting (site `organik-app-d6e58` of the project `organik-d6e58`):

```bash
npm run build
firebase deploy --only hosting
```

`firebase.json` serves `index.html` for every route, caches hashed assets for a year and sends `X-Robots-Tag: noindex`.

## Project Notes
- Translation files are located in `public/i18n/`; English is the default language.
- The landing page address is `landingUrl` in `src/environments/environment*.ts`.
- The landing page links to this application (`/login` and `/register?role=administrator|supplier`), and the login links back to the landing page.
- Releases follow Gitflow and Semantic Versioning; see `CONTRIBUTING.md`.
