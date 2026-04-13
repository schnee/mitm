"use client";

import { useMemo } from "react";
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_PLACES_RADIUS_METERS } from "../lib/env";

export interface MapsConfig {
  apiKey: string;
  placesRadius: number;
  libraries?: ("places" | "marker" | "geometry")[];
}

/**
 * Hook to access Google Maps configuration
 * Provides centralized Maps configuration that can be used by any map component
 */
export function useMapsConfig(): MapsConfig {
  return useMemo(
    () => ({
      apiKey: GOOGLE_MAPS_API_KEY ?? "",
      placesRadius: GOOGLE_MAPS_PLACES_RADIUS_METERS ?? 2500,
      libraries: ["places", "marker", "geometry"] as const
    }),
    [GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_PLACES_RADIUS_METERS]
  );
}

/**
 * Hook to check if Google Maps API key is configured
 * Useful for conditionally rendering map components
 */
export function useHasMapsKey(): boolean {
  return useMemo(() => {
    return Boolean(GOOGLE_MAPS_API_KEY);
  }, [GOOGLE_MAPS_API_KEY]);
}