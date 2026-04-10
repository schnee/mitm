"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  APIProvider,
  Map,
  Marker,
  useMap
} from "@vis.gl/react-google-maps";
import type { RankedVenue } from "../../lib/api/session-client";
import { emitMapTelemetry, type MapTelemetryEvent } from "../../lib/client-telemetry";

function markerClassName(input: {
  venueId: string;
  selectedVenueId: string | null;
  shortlistVenueIds: string[];
  confirmedVenueId: string | null;
}): string {
  if (input.confirmedVenueId === input.venueId) {
    return "marker-confirmed";
  }
  if (input.shortlistVenueIds.includes(input.venueId)) {
    return "marker-shortlisted";
  }
  if (input.selectedVenueId === input.venueId) {
    return "marker-selected";
  }
  return "marker-default";
}

function AutoFitBounds({
  results,
  enabled,
  selectedVenueId,
  onVenueFocus
}: {
  results: RankedVenue[];
  enabled: boolean;
  selectedVenueId: string | null;
  onVenueFocus?: (venueId: string) => void;
}) {
  const map = useMap();
  const prevSelectedRef = useRef<string | null>(null);

  // Handle venue focus (pan to selected venue)
  useEffect(() => {
    if (!map || !selectedVenueId || selectedVenueId === prevSelectedRef.current) {
      return;
    }
    
    const venue = results.find(r => r.venueId === selectedVenueId);
    if (venue && venue.lat != null && venue.lng != null) {
      // Pan to venue while preserving current zoom
      map.panTo({ lat: venue.lat, lng: venue.lng });
      prevSelectedRef.current = selectedVenueId;
    }
  }, [map, selectedVenueId, results]);

  // Auto-fit bounds on initial load
  useEffect(() => {
    if (!map || !enabled || results.length === 0) {
      return;
    }

    // Calculate bounds from results
    const validResults = results.filter(r => r.lat != null && r.lng != null);
    if (validResults.length === 0) return;

    const lats = validResults.map(r => r.lat);
    const lngs = validResults.map(r => r.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Use fitBounds if available, otherwise set center/zoom
    try {
      const bounds = {
        south: minLat,
        west: minLng,
        north: maxLat,
        east: maxLng
      };
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    } catch {
      // Fallback: center on first result with reasonable zoom
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      map.setCenter({ lat: centerLat, lng: centerLng });
      map.setZoom(12);
    }
  }, [map, enabled, results]);

  return null;
}

function FallbackMap({
  results,
  selectedVenueId,
  shortlistVenueIds,
  confirmedVenueId,
  onMarkerSelect
}: {
  results: RankedVenue[];
  selectedVenueId: string | null;
  shortlistVenueIds: string[];
  confirmedVenueId: string | null;
  onMarkerSelect: (venueId: string) => void;
}) {
  return (
    <div className="map-marker-grid" role="list">
      {results.map((result, index) => {
        const markerState = markerClassName({
          venueId: result.venueId,
          selectedVenueId,
          shortlistVenueIds,
          confirmedVenueId
        });
        return (
          <button
            key={result.venueId}
            className={`chip ${markerState}`}
            type="button"
            role="listitem"
            tabIndex={0}
            aria-label={`${result.name} marker ${markerState}`}
            onClick={() => onMarkerSelect(result.venueId)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onMarkerSelect(result.venueId);
              }
            }}
          >
            {index + 1}. {result.name}
          </button>
        );
      })}
    </div>
  );
}

export function RankedSpotsMap({
  results,
  shortlistVenueIds,
  confirmedVenueId,
  selectedVenueId,
  onMarkerSelect,
  onVenueFocus
}: {
  results: RankedVenue[];
  shortlistVenueIds: string[];
  confirmedVenueId: string | null;
  selectedVenueId: string | null;
  onMarkerSelect: (venueId: string) => void;
  onVenueFocus?: (venueId: string) => void;
}) {
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!mapsApiKey) {
      setShowFallback(true);
      return;
    }

    // 5-second timeout to show fallback if map doesn't load
    timeoutRef.current = setTimeout(() => {
      if (!mapLoaded) {
        setShowFallback(true);
        emitMapTelemetry("map_load_failed", { reason: "timeout" });
        emitMapTelemetry("map_fallback_shown", { reason: "timeout" });
      }
    }, 5000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [mapsApiKey, mapLoaded]);

  const handleRetry = useCallback(() => {
    setIsRetrying(true);
    setShowFallback(false);
    setMapLoaded(false);
    emitMapTelemetry("map_retry_clicked", {});

    // Reset after a brief delay to retry
    setTimeout(() => {
      setIsRetrying(false);
      // After retry, if map loads successfully, emit recovered
      setTimeout(() => {
        if (!showFallback) {
          emitMapTelemetry("map_recovered", {});
        }
      }, 6000);
    }, 1000);
  }, [showFallback]);

  const handleMapLoad = useCallback(() => {
    setMapLoaded(true);
    // Only emit recovered if we previously showed fallback
    if (showFallback) {
      emitMapTelemetry("map_recovered", {});
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [showFallback]);

  const handleMapError = useCallback(() => {
    setShowFallback(true);
    emitMapTelemetry("map_load_failed", { reason: "error" });
    emitMapTelemetry("map_fallback_shown", { reason: "error" });
  }, []);

  const shouldShowProviderMap = mapsApiKey && !showFallback;

  const getMarkerColor = (state: string): string => {
    switch (state) {
      case "marker-confirmed":
        return "#10b981";
      case "marker-shortlisted":
        return "#f59e0b";
      case "marker-selected":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  return (
    <section className="panel stage map-container" aria-label="Ranked spots map">
      <h3>Ranked spots map</h3>

      {!mapsApiKey && (
        <p className="status-badge status-waiting">
          Waiting: set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable interactive map markers. List-only mode remains available.
        </p>
      )}

      {mapsApiKey && showFallback && (
        <div className="map-fallback-container">
          <p className="status-badge status-loading">
            Map unavailable. Showing list view.
          </p>
          {!isRetrying && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleRetry}
            >
              Retry map
            </button>
          )}
          {isRetrying && (
            <p className="muted">Retrying...</p>
          )}
          <FallbackMap
            results={results}
            selectedVenueId={selectedVenueId}
            shortlistVenueIds={shortlistVenueIds}
            confirmedVenueId={confirmedVenueId}
            onMarkerSelect={onMarkerSelect}
          />
        </div>
      )}

      {shouldShowProviderMap && (
        <APIProvider apiKey={mapsApiKey} onLoad={handleMapLoad} onError={handleMapError} solutionChannel="GMP_DEV">
          <Map
            mapId="ranked-spots-map"
            defaultCenter={{ lat: 40.7128, lng: -74.006 }}
            defaultZoom={12}
            mapContainerClassName="map-panel"
            gestureHandling="greedy"
            disableDefaultUI={false}
            fullscreenControl={true}
            zoomControl={true}
            streetViewControl={false}
          >
            <AutoFitBounds results={results} enabled={mapLoaded && results.length > 0} selectedVenueId={selectedVenueId} onVenueFocus={onVenueFocus} />
            {results.map((result, index) => {
              if (result.lat == null || result.lng == null) return null;
              
              const state = markerClassName({
                venueId: result.venueId,
                selectedVenueId,
                shortlistVenueIds,
                confirmedVenueId
              });
              const color = getMarkerColor(state);

              return (
                <Marker
                  key={result.venueId}
                  position={{ lat: result.lat, lng: result.lng }}
                  title={result.name}
                  onClick={() => onMarkerSelect(result.venueId)}
                />
              );
            })}
          </Map>
        </APIProvider>
      )}

      {!mapsApiKey && (
        <FallbackMap
          results={results}
          selectedVenueId={selectedVenueId}
          shortlistVenueIds={shortlistVenueIds}
          confirmedVenueId={confirmedVenueId}
          onMarkerSelect={onMarkerSelect}
        />
      )}

      <p className="muted">Interactive marker list is synchronized with the ranked spots list.</p>
    </section>
  );
}