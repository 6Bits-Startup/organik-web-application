# Contributing to OrganiK

Thank you for contributing to the OrganiK web application! This document establishes the engineering standards, architecture rules, and development workflows to maintain high codebase quality, consistency, and scalability.

---

## Table of Contents
1. [Architecture & Design Principles](#architecture--design-principles)
   - [Domain-Driven Design (DDD)](#domain-driven-design-ddd)
   - [Object-Oriented Programming (OOP) & Clean Code](#object-oriented-programming-oop--clean-code)
2. [Git Workflow & Branching Strategy](#git-workflow--branching-strategy)
3. [Conventional Commits](#conventional-commits)
4. [Semantic Versioning (SemVer)](#semantic-versioning-semver)
5. [TypeScript Guidelines](#typescript-guidelines)
6. [Angular & Angular Material Standards](#angular--angular-material-standards)
7. [Quality Assurance & Development Workflow](#quality-assurance--development-workflow)
8. [Pull Request (PR) Process](#pull-request-pr-process)

---

## Architecture & Design Principles

### Domain-Driven Design (DDD)
The project organizes code into **Bounded Contexts** located under `src/app/`, one folder each, mirroring the twelve contexts of the project report:
- **`iam`**: Identity and Access Management (authentication, sign up, users, roles, permissions, guards).
- **`profiles`**: Access profiles and business settings (language and expiration thresholds).
- **`dashboard`**: Read-only composition of figures from the other contexts.
- **`analytics`**: Operational indicators, alert trend and reports.
- **`inventory`**: Stock lots and their expiration policy.
- **`products`**: Product catalog and categories.
- **`requisition`**: Supply requests shared with suppliers.
- **`procurements`**: Shipment orders and their acceptance or rejection.
- **`suppliers`**: Supplier directory and recommendations.
- **`conservation`**: Storage zones, sensor readings and conservation alerts.
- **`communication`**: Alerts and the notifications of the minimarket.
- **`shared`**: Shared Kernel (value objects, `BaseEntity`, base API types, platform switch, shell layout, reusable UI).

Do not merge contexts into one folder. Each bounded context is divided into the architectural layers it needs:
```text
src/app/<bounded-context>/
├── domain/
│   ├── model/           # Entities, value objects, domain interfaces and domain errors.
│                        # Must NOT depend on Angular, HTTP, or UI layers.
├── infrastructure/      # Gateways (*-api.ts extending BaseApi), endpoint classes (*-api-endpoint.ts),
│                        # resource contracts (*-response.ts, *.request.ts), assemblers and seeds.
├── application/         # Signal-based stores and use-case orchestrators.
└── presentation/        # Standalone components, views, forms, guards and route configurations.
    ├── components/      # UI components scoped to the context.
    └── views/           # Routed view pages and forms.
```
`dashboard` has no domain model or backend gateway, so it only contains `application` and `presentation`; `profiles` has no domain model. Add a layer only when it has real content (ADR 012 removed the `domain/services` folders).

### OrganiK Platform integration
- Each resource of the backend has an endpoint class that extends `ErrorHandlingEnabledBaseType`, reads its path from `environment.platformProvider<Resource>EndpointPath` and is created inside the gateway with `new XApiEndpoint(this.http)`.
- Gateways extend `BaseApi`, map platform resources into the resources of the web application and return domain entities through assemblers.
- `iamInterceptor` sends the JWT in every request; gateways read the minimarket or supplier of the signed-in user from `token-storage.ts`.
- `PLATFORM_API_ENABLED` is `true` in `app.config.ts`; unit tests leave it off so that every gateway answers from its in-memory seed.

Contexts depend on each other only through the public API of their `application` layer (for example `InventoryStore` reads `ProductsStore`) or through the Shared Kernel. A `domain` folder never imports another context.

### Object-Oriented Programming (OOP) & Clean Code
- **SOLID Principles**: Adhere to Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion across all classes and abstractions.
- **Encapsulation**: Domain entities expose `readonly` state and business behavior (for example `ShipmentOrder.acceptReception`) instead of plain mutable data, and validate their invariants in the constructor, raising a `DomainError` when they are violated.
- **Value Objects**: Model quantities, money, percentages, e-mail addresses and dates with the immutable value objects of the Shared Kernel (`Quantity`, `Money`, `Percentage`, `EmailAddress`, `CalendarDate`, `DateTime`) instead of primitives.
- **Assembler Pattern**: Keep infrastructure resources (`*Resource`, `*Response`) decoupled from domain entities using dedicated bidirectional assemblers; gateways return entities, never raw resources.
- **Current date**: Read it with `CalendarDate.today()`; tests freeze it with `vi.setSystemTime`.
- **Composition over Inheritance**: Prefer composing small services and stores over deep class hierarchies.
- **Clean Code**: Use intention-revealing names, keep functions small, comment the "why" and document public classes and methods with TSDoc.

---

## Git Workflow & Branching Strategy

We follow the standard **Git Flow** branching model:

```text
main ──────────────────────────────────────────●────── (Production Releases)
         \                                    /
develop ──●─────────●───────────────●────────●──────── (Integration Branch)
           \       /                 \      /
feature/    ●─────●                   ●────●           (Feature Branches)
```

### Branch Types & Naming Conventions
- `main`: Production-ready code. Merged from `develop` (pull request), `release/*` or `hotfix/*` branches. Tagged with SemVer tags (e.g., `v2.0.0`).
- `develop`: Primary integration branch where completed features are merged.
- `feature/<context>-<short-description>`: New features or enhancements (branched from `develop`, merged back to `develop` with `--no-ff`).
  - *Example:* `feature/inventory-stock-form`, `feature/iam-registration`
- `fix/<context>-<issue-description>`: Non-urgent bug fixes (branched from `develop`, merged back to `develop`).
  - *Example:* `fix/analytics-trend-spike`
- `refactor/<description>` and `docs/<description>`: Structural changes and documentation (branched from `develop`).
- `release/<MAJOR.MINOR.PATCH>`: Release preparation, final validation, version bump and changelog (branched from `develop`, merged to `main` and `develop`).
- `hotfix/<MAJOR.MINOR.PATCH>`: Critical production fixes (branched directly from `main`, merged to `main` and `develop`).

Only `main` and `develop` are long-lived: delete every other branch once it is merged.

---

## Conventional Commits

Commit messages must follow the [Conventional Commits v1.0.0](https://www.conventionalcommits.org/) specification.

### Commit Format
```text
<type>(<scope>): <short summary in imperative mood>

[optional body providing technical context, rationale, and motivation]

[optional footer(s) such as BREAKING CHANGE or issue tracker references]
```

### Commit Types
| Type       | Description                                                  |
|------------|--------------------------------------------------------------|
| `feat`     | A new feature for the user or system                         |
| `fix`      | A bug fix                                                    |
| `docs`     | Documentation changes only                                   |
| `style`    | Formatting, missing semi-colons, whitespace (no code change) |
| `refactor` | Refactoring code without fixing a bug or adding a feature    |
| `perf`     | Code changes that improve performance                        |
| `test`     | Adding or updating unit tests                                |
| `build`    | Build system, toolchain, or external dependency changes      |
| `ci`       | CI configuration files and automation scripts                |
| `chore`    | Maintenance tasks that do not alter production code          |

### Allowed Scopes
Scopes must match a Bounded Context, core layer, or tool: `iam`, `profiles`, `dashboard`, `analytics`, `inventory`, `products`, `requisition`, `procurements`, `suppliers`, `conservation`, `communication`, `shared`, `app`, `api`, `i18n`, `deps`, `config`, `theme`, `firebase`, `release`.

### Examples
- `feat(inventory): add search filter to the stock list`
- `fix(iam): keep the requested url after signing in`
- `docs(architecture): describe the twelve bounded contexts`
- `refactor(requisition): split procurement into two bounded contexts`
- `build(firebase): configure Firebase Hosting`

---

## Semantic Versioning (SemVer)

Versions follow the [SemVer 2.0.0](https://semver.org/) schema: `MAJOR.MINOR.PATCH`

- **MAJOR (`X.0.0`)**: Incompatible API changes, breaking route restructuring, or fundamental architecture rewrites.
- **MINOR (`0.X.0`)**: Backwards-compatible new features, new bounded contexts, or added capabilities.
- **PATCH (`0.0.X`)**: Backwards-compatible bug fixes, documentation and security patches.

Every release updates `package.json`, closes the `Unreleased` section of `CHANGELOG.md` with the date, and is tagged `v<MAJOR.MINOR.PATCH>` on `main`. Version 2.0.0 is a MAJOR release because the application moved from the fake API to the OrganiK Platform backend.

### Release process
1. In `develop`, move the `## [Unreleased]` entries of `CHANGELOG.md` to `## [X.Y.Z] - YYYY-MM-DD` and set `"version": "X.Y.Z"` in `package.json` (`chore(release): prepare X.Y.Z`).
2. Merge `develop` into `main` with a pull request.
3. On GitHub, draft a release with the tag `vX.Y.Z` on `main`, use the changelog section as its notes and publish it.
4. Merge `main` back into `develop` if the release added commits to `main`.

---

## TypeScript Guidelines

- **Type Safety**: Keep strict type checking. Avoid `any`: use explicit interfaces, generics, or `unknown` (with type narrowing) instead.
- **Compiler Options**: Respect `noImplicitOverride`, `noImplicitReturns` and `noPropertyAccessFromIndexSignature` from `tsconfig.json`.
- **Immutability in Domain Models**: Declare entity and value object fields as `readonly` (or private fields with accessors, as `User` does to implement `BaseEntity`) and return new instances for changes.
- **Naming Conventions**:
  - `PascalCase`: Classes, interfaces, types, enums, components (`StockLot`, `ProductsStore`, `InventoryList`).
  - `camelCase`: Properties, methods, functions, variables, signals (`requestItems`, `loadProducts`, `currentUser`).
  - `UPPER_SNAKE_CASE`: Global constants and immutable configuration maps (`NAVIGATION_ITEMS`, `ROLES`).
  - `kebab-case`: All file and folder names (`stock-lot.entity.ts`, `inventory-list.html`).
- **Documentation**: Public classes, methods and exported constants carry TSDoc comments; the language of code, names and comments is English.

---

## Angular & Angular Material Standards

### Angular Modern Conventions
- **Standalone Components**: Do not use `NgModule`. Declare components, pipes, and directives as standalone.
- **Dependency Injection**: Use `inject(Service)` rather than constructor-based injection for cleaner, modern DI.
- **Reactivity via Signals**:
  - Use `signal()` and `computed()` for local and store state.
  - Use signal-based `input()` and `output()` for component communication.
- **Change Detection**: Rely on Angular's zoneless, default `OnPush` change detection and signal-based reactivity.
- **Lazy Loading**: Expose each context routes from a `*.routes.ts` file and load it with `loadChildren` / `loadComponent`.
- **Reactive Forms**: Use `FormBuilder` with `FormControl` and `Validators`; the shared patterns live in `shared/presentation/forms/form-patterns.ts`.

### Angular Material (M3) Guidelines
- **Theme Consistency**: Use Material 3 (M3) design tokens and `@angular/material` mixins (`@include mat.theme(...)`, `mat.theme-overrides`) in `src/material-theme.scss`.
- **Design Tokens**: Use the `--ok-*` tokens of `src/styles.css` (colors, radius, shadow, motion) instead of hardcoded values.
- **Motion**: Entrance animations must respect `prefers-reduced-motion`.
- **Accessibility (a11y)**:
  - All interactive elements must include descriptive `aria-label` or visible labels.
  - Decorative icons use `aria-hidden="true"`; images supply descriptive `alt` attributes.
  - Ensure a color contrast of at least 4.5:1 complying with WCAG 2.1 AA standards.

### Internationalization (i18n)
- Do not hardcode UI strings in component templates or code.
- Add English keys to `public/i18n/en.json` and Spanish translations to `public/i18n/es.json`; English is the default language.
- Render localized strings in templates using the `translate` pipe: `{{ 'inventory.title' | translate }}`.

---

## Quality Assurance & Development Workflow

### Prerequisites
- Node.js (Active LTS or modern version)
- npm
- The OrganiK Platform backend running locally to use the application (see the README)

### Development Commands
```bash
# Install dependencies
npm install

# Start development server
npm start

# Run unit tests (Vitest)
npm test -- --watch=false

# Build production bundle
npm run build

# Deploy to Firebase Hosting (maintainers)
firebase deploy --only hosting
```

### Tests
- Cover domain entities, value objects and stores with unit tests next to their source (`*.spec.ts`).
- Freeze time with `vi.setSystemTime` and use fake timers for the simulated gateway latency.
- Unit tests build with `environment.unit.ts` and keep `PLATFORM_API_ENABLED` off, so they never call the backend.

---

## Pull Request (PR) Process

Before submitting a pull request, verify that:
1. [ ] Code adheres to DDD boundaries (one folder per bounded context) and OOP principles.
2. [ ] All commit messages adhere to Conventional Commits.
3. [ ] All unit tests pass cleanly (`npm test -- --watch=false`).
4. [ ] Production build succeeds without budget or compilation errors (`npm run build`).
5. [ ] Documentation, user stories, class diagrams and ADRs are updated if architectural changes are introduced.
6. [ ] New UI strings exist in both `en.json` and `es.json`.
7. [ ] The PR targets the `develop` branch (or `main` for hotfixes).
