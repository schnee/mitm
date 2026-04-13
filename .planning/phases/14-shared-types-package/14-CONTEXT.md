# Phase 14 Context: Shared Types Package

## Overview

Create a shared types package that can be used by both frontend and backend to ensure type consistency.

## Problem

Currently, these types are duplicated:
- `PreferenceTag` - in session-client.ts and services/api/src/modules/ranking/contracts.ts
- `WillingnessSplit` - in session-client.ts and services/api/src/modules/ranking/contracts.ts  
- `RankedVenue` - in session-client.ts and services/api/src/modules/ranking/contracts.ts

This duplication creates maintenance burden and risk of divergence.

## Solution

Create `@mitm/types` package in `packages/types/`:
- Export shared types from a single source
- Both frontend and backend import from the package
- TypeScript ensures compile-time parity

## Files Created

- packages/types/package.json
- packages/types/tsconfig.json
- packages/types/src/index.ts
- packages/types/src/ranking.ts
- packages/types/src/session.ts

## Files Modified

- services/api/src/modules/ranking/contracts.ts
- src/lib/api/session-client.ts
- package.json (workspace config)

## Success Criteria

- @mitm/types package builds successfully
- Frontend and backend import from @mitm/types
- No type duplication in codebase