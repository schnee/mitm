"use client";

import { useState, useEffect, useCallback } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap
} from "@vis.gl/react-google-maps";
import type { RankedVenue } from "../../lib/api/session-client";

export type MapStage = "setup" | "spots" | "shortlist" | "confirm";

interface PersistentMapProps {
  stage: MapStage;
  userLocation?: { lat: number; lng: number } | null;
  clickedLocation?: { lat: number; lng: number } | null;
  results?: RankedVenue[];
  shortlistVenueIds?: string[];
  confirmedVenueId?: string | null;
  confirmedVenueLocation?: { lat: number; lng: number } | null;
  selectedVenueId?: string | null;
  focusedVenueId?: string | null;
  onMarkerSelect?: (venueId: string) => void;
  onVenueFocus?: (venueId: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

function markerClassName(input: {
  venueId: string;
  selectedVenueId: string | null;
  shortlistVenueIds: string[];
  confirmedVenueId: string | null;
  focusedVenueId: string | null;
}): string {
  if (input.confirmedVenueId === input.venueId) return "marker-confirmed";
  if (input.shortlistVenueIds.includes(input.venueId)) return "marker-shortlisted";
  if (input.focusedVenueId === input.venueId) return "marker-focused";
  if (input.selectedVenueId === input.venueId) return "marker-selected";
  return "marker-default";
}

function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !onMapClick) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listener = map.addListener("click", (e: any) => {
      const latLng = e.latLng;
      if (latLng) onMapClick(latLng.lat(), latLng.lng());
    });
    return () => listener.remove();
  }, [map, onMapClick]);

  return null;
}

export function PersistentMap({
  stage,
  userLocation,
  clickedLocation,
  results = [],
  shortlistVenueIds = [],
  confirmedVenueId = null,
  confirmedVenueLocation,
  selectedVenueId = null,
  focusedVenueId = null,
  onMarkerSelect,
  onMapClick
}: PersistentMapProps) {
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  // Get initial location on mount (like SetupCard)
  useEffect(() => {
    if (stage !== "setup") return;
    if (userLocation) {
      setMapCenter(userLocation);
      return;
    }
    if (clickedLocation) {
      setMapCenter(clickedLocation);
      return;
    }
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => setMapCenter({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => setMapCenter({ lat: 40.7128, lng: -74.006 }),
        { timeout: 10000 }
      );
    } else {
      setMapCenter({ lat: 40.7128, lng: -74.006 });
    }
  }, [stage, userLocation, clickedLocation]);

  // For non-setup stages, use first result or confirmed location
  useEffect(() => {
    if (stage === "setup") return;
    if (results.length > 0 && results[0].lat != null && results[0].lng != null) {
      setMapCenter({ lat: results[0].lat, lng: results[0].lng });
    } else if (confirmedVenueLocation) {
      setMapCenter(confirmedVenueLocation);
    } else if (userLocation) {
      setMapCenter(userLocation);
    }
  }, [stage, results, confirmedVenueLocation, userLocation]);

  const getMarkerColor = (state: string): string => {
    switch (state) {
      case "marker-confirmed": return "#10b981";
      case "marker-shortlisted": return "#f59e0b";
      case "marker-focused": return "#f97316";
      case "marker-selected": return "#3b82f6";
      default: return "#6b7280";
    }
  };

  const showSetupView = stage === "setup";
  const defaultCenter = mapCenter ?? { lat: 40.7128, lng: -74.006 };

  const renderMarkers = () => {
    // Setup: show marker only after user clicks to set location (not auto-detected)
    if (showSetupView && clickedLocation) {
      return (
        <AdvancedMarker position={clickedLocation} title="Your location">
          <Pin background="#2563eb" glyphColor="#ffffff" />
        </AdvancedMarker>
      );
    }

    // Confirm: show confirmed venue
    if (stage === "confirm" && confirmedVenueLocation) {
      return (
        <AdvancedMarker position={confirmedVenueLocation} title="Confirmed meeting spot">
          <Pin background="#10b981" glyphColor="#ffffff" />
        </AdvancedMarker>
      );
    }

    // Spots/shortlist: show results
    if (stage === "spots" || stage === "shortlist") {
      return results.map((result) => {
        if (result.lat == null || result.lng == null) return null;
        const state = markerClassName({
          venueId: result.venueId,
          selectedVenueId,
          shortlistVenueIds,
          confirmedVenueId,
          focusedVenueId: focusedVenueId ?? null
        });
        return (
          <AdvancedMarker
            key={result.venueId}
            position={{ lat: result.lat, lng: result.lng }}
            title={result.name}
            onClick={() => onMarkerSelect?.(result.venueId)}
          >
            <Pin background={getMarkerColor(state)} glyphColor="#ffffff" />
          </AdvancedMarker>
        );
      });
    }

    return null;
  };

  if (!mapCenter) {
    return (
      <div className="map-loading">
        <p className="muted">Loading map...</p>
      </div>
    );
  }

  const mapHeight = showSetupView ? "100%" : "350px";
  
  return (
    <APIProvider apiKey={mapsApiKey}>
      <Map
        mapId="persistent-map"
        defaultCenter={defaultCenter}
        defaultZoom={showSetupView ? 13 : 12}
        mapContainerClassName="map-panel persistent-map"
        style={{ height: mapHeight, minHeight: "350px" }}
        gestureHandling="greedy"
        disableDefaultUI={false}
        fullscreenControl={true}
        zoomControl={true}
        streetViewControl={false}
      >
        <MapClickHandler onMapClick={showSetupView ? onMapClick : undefined} />
        {renderMarkers()}
      </Map>
    </APIProvider>
  );
}