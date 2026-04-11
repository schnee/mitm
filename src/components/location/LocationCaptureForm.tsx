"use client";

import { useState, useEffect } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap
} from "@vis.gl/react-google-maps";
import { upsertLocationDraft } from "../../lib/api/session-client";

type GeoErrorCode = "PERMISSION_DENIED" | "POSITION_UNAVAILABLE" | "TIMEOUT" | null;

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listener = map.addListener("click", (e: any) => {
      const latLng = e.latLng;
      if (latLng) {
        onMapClick(latLng.lat(), latLng.lng());
      }
    });
    return () => listener.remove();
  }, [map, onMapClick]);

  return null;
}

export function LocationCaptureForm({
  sessionId,
  participantId,
  onDraftSaved
}: {
  sessionId: string;
  participantId: string;
  onDraftSaved: () => void;
}) {
  const [geoError, setGeoError] = useState<GeoErrorCode>(null);
  const [statusType, setStatusType] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("Set your location using the map below or use current location.");
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {},
      { timeout: 5000 }
    );
  }, []);

  const statusClass =
    statusType === "loading"
      ? "status-loading"
      : statusType === "success"
        ? "status-success"
        : statusType === "error"
          ? "status-error"
          : "status-idle";

  const handleMapClick = async (lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    try {
      setStatusType("loading");
      setStatusMessage("Saving...");
      await upsertLocationDraft({
        mode: "manual",
        sessionId,
        participantId,
        lat,
        lng,
        addressLabel: "Map-click"
      });
      setStatusType("success");
      setStatusMessage("Location saved!");
      setGeoError(null);
      onDraftSaved();
    } catch {
      setStatusType("error");
      setStatusMessage("Error saving location. Try again.");
    }
  };

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeoError("POSITION_UNAVAILABLE");
      setStatusType("error");
      setStatusMessage("Geolocation unavailable. Click the map.");
      return;
    }

    setStatusType("loading");
    setStatusMessage("Getting current location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await upsertLocationDraft({
            mode: "geolocation",
            sessionId,
            participantId,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            addressLabel: "Current location"
          });
          setStatusType("success");
          setStatusMessage("Location saved!");
          setGeoError(null);
          onDraftSaved();
        } catch {
          setStatusType("error");
          setStatusMessage("Error saving location. Click the map instead.");
        }
      },
      (error) => {
        if (error.code === 1) setGeoError("PERMISSION_DENIED");
        else if (error.code === 2) setGeoError("POSITION_UNAVAILABLE");
        else setGeoError("TIMEOUT");
        setStatusType("error");
        setStatusMessage("Could not get location. Click the map.");
      },
      { timeout: 10_000 }
    );
  };

  return (
    <section className="panel stage location-capture-section" aria-labelledby="location-capture-title">
      <header className="section-header">
        <h2 id="location-capture-title">Set your location</h2>
      </header>

      <div className="btn-row">
        <button className="btn-secondary" type="button" onClick={useCurrentLocation}>
          Use current location
        </button>
      </div>

      {geoError && (
        <p className="status-badge status-error" role="status" aria-live="polite">
          {geoError === "PERMISSION_DENIED" ? "Location permission denied" : "Could not get location"}. Click the map instead.
        </p>
      )}

      {mapsApiKey && (
        <div className="location-map-container">
          <p className="muted">Click map to set your location:</p>
          <APIProvider apiKey={mapsApiKey} solutionChannel="GMP_DEV">
            <Map
              mapId="location-capture-map"
              defaultCenter={mapCenter ?? { lat: 30.2672, lng: -97.7431 }}
              defaultZoom={12}
              mapContainerClassName="location-map"
              gestureHandling="greedy"
              disableDefaultUI={false}
              fullscreenControl={true}
              zoomControl={true}
              streetViewControl={false}
            >
              <MapClickHandler onMapClick={handleMapClick} />
              {selectedLat !== null && selectedLng !== null && (
                <AdvancedMarker position={{ lat: selectedLat, lng: selectedLng }}>
                  <Pin background={"#3b82f6"} glyphColor={"#ffffff"} />
                </AdvancedMarker>
              )}
            </Map>
          </APIProvider>
        </div>
      )}

      <p className={`status-badge ${statusClass}`} role="status" aria-live="polite">
        {statusMessage}
      </p>
    </section>
  );
}