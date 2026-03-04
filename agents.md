# LifeOS - agents.md

## Project Overview

Mobile-first modular super app (PWA) built with: - Next.js (App
Router) - TypeScript (strict mode) - Tailwind CSS - shadcn/ui -
Zustand - Dexie (IndexedDB) - Zod - Recharts

------------------------------------------------------------------------

## 1. Architectural Principles

### 1.1 Feature-Based Modularity (MANDATORY)

Each feature must live inside:

/features/`<feature-name>`{=html}/

Each feature contains: - components/ - hooks/ - store/ - repository/ -
schemas/ - types.ts

No cross-feature imports except via service interfaces or shared
utilities.

------------------------------------------------------------------------

### 1.2 Strict Layer Separation

UI Layer: - React components only - No business logic - No database
access

Store Layer: - Zustand only - Calls services or repositories

Repository Layer: - Dexie interaction only - No UI imports

Service Layer: - Interface definitions - Swappable implementations

------------------------------------------------------------------------

## 2. Data Rules

-   All persistent data must use Dexie.
-   All models must use Zod schema validation.
-   Never bypass repository layer.
-   No direct IndexedDB usage outside /lib/db.

------------------------------------------------------------------------

## 3. State Management Rules

-   One Zustand store per feature.
-   No global mega-store.
-   No cross-store mutation.

------------------------------------------------------------------------

## 4. Service Abstractions

Define interfaces in /lib/services: - AuthService - StockPriceService -
TravelSearchService - AIService

UI must depend only on interfaces, not implementations.

------------------------------------------------------------------------

## 5. UI/UX Constraints

-   Mobile-first only
-   Bottom tab navigation
-   Card-based dashboard
-   Minimalist design
-   Dark/light mode required

------------------------------------------------------------------------

## 6. PWA Rules

-   Must remain installable
-   Offline-first
-   No server-only dependencies

------------------------------------------------------------------------

## 7. Code Quality

-   TypeScript strict mode
-   No `any`
-   No console.log (use logging utility)
-   No dead code

------------------------------------------------------------------------

## 8. Incremental Development

-   Modify only requested feature
-   Avoid global refactors without approval
-   Preserve compile state
