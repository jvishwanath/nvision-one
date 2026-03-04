# LifeOS - architecture.md

## High-Level Architecture

Mobile-First Progressive Web App (PWA)

Frontend: - Next.js (App Router) - Tailwind CSS - shadcn/ui

State Layer: - Zustand per feature

Persistence: - Dexie (IndexedDB) - Zod for schema validation

Services (Abstracted): - AuthService - StockPriceService -
TravelSearchService - AIService

------------------------------------------------------------------------

## Data Flow

UI -\> Store (Zustand) -\> Service/Repository -\> Dexie (IndexedDB)

No direct UI to database access.

------------------------------------------------------------------------

## Feature Modules

Each feature contains: - Components - Store - Repository - Schemas -
Types

Modules: - Dashboard - Tasks - Notes - Finance - Travel

------------------------------------------------------------------------

## Offline-First Strategy

-   All core features function without backend
-   Service interfaces allow future cloud injection
-   Sync strategy (future):
    -   Background sync
    -   Conflict resolution via timestamps
    -   Server as source of truth (optional mode)

------------------------------------------------------------------------

## Backend Integration Plan

Auth: - Plug Supabase/Firebase into AuthService - disable it by default.

Finance: - Inject stock API into StockPriceService using yahoo finance API

Travel: - Inject any free travel flight search API into TravelSearchService

AI: - Inject any free LLM provider into AIService

------------------------------------------------------------------------

## Native Conversion Strategy

Use Capacitor or Expo wrapper once PWA stabilizes.

------------------------------------------------------------------------

## Non-Functional Goals

-   Modular scalability
-   Strict separation of concerns
-   Replaceable services
-   Incremental feature expansion
