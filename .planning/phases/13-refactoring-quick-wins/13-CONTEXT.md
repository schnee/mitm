# Phase 13 Context: Refactoring Quick Wins

## Overview

Quick wins phase to centralize configuration and eliminate code duplication across the codebase.

## Refactoring Items

### 1. Environment Variable Centralization
- **Problem**: `NEXT_PUBLIC_API_BASE_URL` is defined in both `session-client.ts` and `useSessionSync.ts`
- **Solution**: Create `src/lib/env.ts` with centralized env var configuration

### 2. Error Codes Constants
- **Problem**: Error codes are scattered across backend routes
- **Solution**: Create `services/api/src/lib/error-codes.ts`

### 3. Shared Maps Config Hook
- **Problem**: Maps config is used in multiple components without a consistent interface
- **Solution**: Create `useMapsConfig()` hook in `src/hooks/`

### 4. Configurable Session TTL
- **Problem**: Session TTL is hardcoded
- **Solution**: Add `SESSION_TTL_HOURS` env var

### 5. Polling Optimization
- **Problem**: Fallback polling runs every 1 second (too aggressive)
- **Solution**: Increase to 3 seconds

## Files Modified

- src/lib/env.ts (new)
- src/lib/api/session-client.ts
- src/hooks/useSessionSync.ts
- src/hooks/useMapsConfig.ts (new)
- services/api/src/lib/error-codes.ts (new)
- .env.example

## Success Criteria

All refactoring items complete without breaking existing functionality.