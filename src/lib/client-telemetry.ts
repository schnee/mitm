/**
 * Simple client-side telemetry for map integration events.
 * In production, this would send events to an analytics backend.
 */

export type MapTelemetryEvent =
  | "map_load_failed"
  | "map_fallback_shown"
  | "map_retry_clicked"
  | "map_recovered";

export function emitMapTelemetry(event: MapTelemetryEvent, metadata?: Record<string, unknown>): void {
  // In development, log to console. In production, send to analytics service.
  if (process.env.NODE_ENV === "development") {
    console.log(`[Telemetry] ${event}`, metadata ?? "");
  }

  // In production, uncomment and configure actual analytics endpoint:
  // try {
  //   fetch('/api/telemetry', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ event, timestamp: Date.now(), ...metadata })
  //   }).catch(() => {});
  // } catch {
  //   // Silently fail - telemetry should not block user interactions
  // }
}