"use client";

import { useState, useEffect } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap
} from "@vis.gl/react-google-maps";
import {
  type RankingLifecycleResponse,
  type PreferenceTag,
  type WillingnessSplit,
  upsertLocationDraft,
  confirmLocation,
  upsertRankingInputs
} from "../../lib/api/session-client";

const TAG_LABELS: Array<{ value: PreferenceTag; label: string }> = [
  { value: "coffee", label: "coffee" },
  { value: "lunch", label: "lunch" },
  { value: "dinner", label: "dinner" },
  { value: "cocktails", label: "cocktails" },
  { value: "dessert", label: "dessert" },
  { value: "museum", label: "museum" },
  { value: "walk_and_talk", label: "walk and talk" },
  { value: "vintage_shops", label: "vintage shops" },
  { value: "quiet", label: "quiet" }
];

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

export function SetupCard({
  sessionId,
  participantId,
  onSetupComplete
}: {
  sessionId: string;
  participantId: string;
  onSetupComplete: (result: { rankingInputsReady: boolean; rankingLifecycle: RankingLifecycleResponse }) => void;
}) {
  const [geoError, setGeoError] = useState<GeoErrorCode>(null);
  const [statusType, setStatusType] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("Click the map to set your location");
  
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  
  const [split, setSplit] = useState<WillingnessSplit>("60_40");
  const [tags, setTags] = useState<PreferenceTag[]>(["coffee"]);

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const hasMapsKey = Boolean(mapsApiKey);

  // Get initial position
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError("PERMISSION_DENIED");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGeoError("POSITION_UNAVAILABLE");
        } else if (error.code === error.TIMEOUT) {
          setGeoError("TIMEOUT");
        }
        // Default to NYC
        setMapCenter({ lat: 40.7128, lng: -74.006 });
      }
    );
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    setStatusMessage(`Location set: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  const toggleTag = (tag: PreferenceTag) => {
    setTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag].slice(0, 5)
    );
  };

  const submit = async () => {
    if (selectedLat === null || selectedLng === null) {
      setStatusType("error");
      setStatusMessage("Please click the map to set your location first");
      return;
    }

    try {
      setStatusType("loading");
      setStatusMessage("Saving your location...");

      // Step 1: Save location
      await upsertLocationDraft({
        sessionId,
        participantId,
        mode: "manual",
        lat: selectedLat,
        lng: selectedLng,
        addressLabel: "Map-click"
      });

      // Step 1b: Confirm location to finalize
      await confirmLocation({ sessionId, participantId });

      setStatusMessage("Location saved. Saving preferences...");

      // Step 2: Save preferences
      const result = await upsertRankingInputs({ sessionId, participantId, split, tags });

      setStatusType("success");
      if (result.rankingLifecycle.state === "waiting") {
        setStatusMessage("Setup complete. Waiting for your partner to finish.");
      } else {
        setStatusMessage("Setup complete! Generating shared suggestions...");
      }

      onSetupComplete({ rankingInputsReady: result.rankingInputsReady, rankingLifecycle: result.rankingLifecycle });
    } catch {
      setStatusType("error");
      setStatusMessage("Error: unable to save. Check your selection and retry.");
    }
  };

  const statusClass = statusType === "loading" ? "status-loading" : statusType === "success" ? "status-success" : statusType === "error" ? "status-error" : "status-idle";

  if (!hasMapsKey) {
    return (
      <section className="panel stage" aria-labelledby="setup-title">
        <header className="section-header">
          <h2 id="setup-title">Set up your meet-up</h2>
          <p>Configure your location and preferences in one step.</p>
        </header>
        <div className="status-badge status-error" role="status">
          Missing Google Maps API key. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local
        </div>
      </section>
    );
  }

  return (
    <section className="panel stage" aria-labelledby="setup-title">
      <header className="section-header">
        <h2 id="setup-title">Set up your meet-up</h2>
        <p>Click the map to set your location, then choose your preferences below.</p>
      </header>

      <div className="setup-grid">
        <div className="map-container" style={{ height: "280px", width: "100%" }}>
          <APIProvider apiKey={mapsApiKey}>
            {mapCenter && (
              <Map
                defaultCenter={mapCenter}
                defaultZoom={13}
                mapId="location-capture-map"
                style={{ width: "100%", height: "100%" }}
                zoomControl={true}
                streetViewControl={false}
                mapTypeControl={false}
                fullscreenControl={false}
              >
                <MapClickHandler onMapClick={handleMapClick} />
                {selectedLat !== null && selectedLng !== null && (
                  <AdvancedMarker position={{ lat: selectedLat, lng: selectedLng }}>
                    <Pin background="#2563eb" glyphColor="#ffffff" />
                  </AdvancedMarker>
                )}
              </Map>
            )}
          </APIProvider>
        </div>

        <div className="preferences-panel">
          {geoError && (
            <p className="status-badge status-error" role="status">
              Could not get your location. Click the map to set it manually.
            </p>
          )}

          <p className={`status-badge ${statusClass}`} role="status" aria-live="polite">
            {statusMessage}
          </p>

          <fieldset className="panel input-stack">
        <legend>Travel split</legend>
        <label htmlFor="split-50-50">
          <input
            id="split-50-50"
            type="radio"
            name="split"
            value="50_50"
            checked={split === "50_50"}
            onChange={() => setSplit("50_50")}
          />
          50/50
        </label>
        <label htmlFor="split-60-40">
          <input
            id="split-60-40"
            type="radio"
            name="split"
            value="60_40"
            checked={split === "60_40"}
            onChange={() => setSplit("60_40")}
          />
          60/40
        </label>
        <label htmlFor="split-70-30">
          <input
            id="split-70-30"
            type="radio"
            name="split"
            value="70_30"
            checked={split === "70_30"}
            onChange={() => setSplit("70_30")}
          />
          70/30
        </label>
      </fieldset>

      <fieldset className="panel input-stack">
        <legend>Preference tags (select up to 5)</legend>
        <div className="chip-list">
          {TAG_LABELS.map((tag) => (
            <label key={tag.value} className="chip" htmlFor={`tag-${tag.value}`}>
              <input
                id={`tag-${tag.value}`}
                type="checkbox"
                checked={tags.includes(tag.value)}
                onChange={() => toggleTag(tag.value)}
              />
              {tag.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="btn-row">
          <button
            className="btn-primary"
            type="button"
            disabled={selectedLat === null || statusType === "loading"}
            onClick={() => {
              void submit();
            }}
          >
            Continue
          </button>
        </div>
        </div>
      </div>
    </section>
  );
}