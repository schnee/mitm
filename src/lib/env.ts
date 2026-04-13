/**
 * Centralized environment variable configuration
 * All environment variables should be imported from this file to ensure consistency
 * across the application.
 */

/** API Base URL for backend services */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

/** Google Maps API Key */
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/** Radius in meters for Places API searches */
export const GOOGLE_MAPS_PLACES_RADIUS_METERS = parseInt(process.env.GOOGLE_MAPS_PLACES_RADIUS_METERS ?? "2500", 10);

/** Session Time-To-Live in hours (default: 24) */
export const SESSION_TTL_HOURS = parseInt(process.env.SESSION_TTL_HOURS ?? "24", 10);

/** API server port (default: 8080) */
export const API_PORT = parseInt(process.env.API_PORT ?? "8080", 10);

/** Application URL */
export const APP_URL = process.env.APP_URL;

/** Fallback polling interval in milliseconds (increased from 1000 to 3000 for reduced server load) */
export const FALLBACK_POLLING_INTERVAL_MS = parseInt(process.env.FALLBACK_POLLING_INTERVAL_MS ?? "3000", 10);