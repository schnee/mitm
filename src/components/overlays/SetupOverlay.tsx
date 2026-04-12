"use client";

import { useState, useEffect } from "react";
import type { PreferenceTag, WillingnessSplit, RankingLifecycleResponse } from "../../lib/api/session-client";

const TAG_LABELS: Array<{ value: PreferenceTag; label: string }> = [
  { value: "coffee", label: "coffee" },
  { value: "lunch", label: "lunch" },
  { value: "dinner", label: "dinner" },
  { value: "cocktails", label: "cocktails" },
  { value: "dessert", label: "dessert" },
  { value: "museum", label: "museum" },
  { value: "walk_and_talk", label: "walk & talk" },
  { value: "vintage_shops", label: "vintage shops" },
  { value: "quiet", label: "quiet" }
];

type GeoErrorCode = "PERMISSION_DENIED" | "POSITION_UNAVAILABLE" | "TIMEOUT" | null;

interface SetupOverlayProps {
  sessionId: string;
  participantId: string;
  selectedLocation?: { lat: number; lng: number } | null;
  onSetupComplete: (result: { rankingInputsReady: boolean; rankingLifecycle: RankingLifecycleResponse }) => void;
}

export function SetupOverlay({ sessionId, participantId, selectedLocation, onSetupComplete }: SetupOverlayProps) {
  const [geoError, setGeoError] = useState<GeoErrorCode>(null);
  const [statusType, setStatusType] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("Click the map to set your location");

  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);

  const detectLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeoError("POSITION_UNAVAILABLE");
      return;
    }
    
    setStatusType("loading");
    setStatusMessage("Detecting your location...");
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSelectedLat(position.coords.latitude);
        setSelectedLng(position.coords.longitude);
        setStatusMessage(`Location detected: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        setStatusType("idle");
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError("PERMISSION_DENIED");
          setStatusMessage("Location permission denied. Click the map to set manually.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGeoError("POSITION_UNAVAILABLE");
          setStatusMessage("Location unavailable. Click the map to set manually.");
        } else {
          setGeoError("TIMEOUT");
          setStatusMessage("Location timed out. Click the map to set manually.");
        }
        setStatusType("idle");
      },
      { timeout: 10000 }
    );
  };

  useEffect(() => {
    if (selectedLocation) {
      setSelectedLat(selectedLocation.lat);
      setSelectedLng(selectedLocation.lng);
      setStatusMessage(`Location set: ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`);
    }
  }, [selectedLocation]);
  
  const [split, setSplit] = useState<WillingnessSplit>("60_40");
  const [tags, setTags] = useState<PreferenceTag[]>(["coffee"]);

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

      const { upsertLocationDraft, confirmLocation, upsertRankingInputs } = await import("../../lib/api/session-client");

      await upsertLocationDraft({
        sessionId,
        participantId,
        mode: "manual",
        lat: selectedLat,
        lng: selectedLng,
        addressLabel: "Map-click"
      });

      await confirmLocation({ sessionId, participantId });

      setStatusMessage("Location saved. Saving preferences...");

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

  return (
    <div className="overlay-panel setup-overlay">
      <header className="section-header">
        <h2>Set up your meet-up</h2>
        <p>Set your location, then choose your preferences below.</p>
      </header>

      {geoError && (
        <p className="status-badge status-error" role="status">
          Could not get your location. Click the map to set it manually.
        </p>
      )}

      <p className={`status-badge ${statusClass}`} role="status" aria-live="polite">
        {statusMessage}
      </p>

      <fieldset className="panel input-stack">
        <legend>Travel willingness</legend>
        <div className="slider-container">
          <input
            type="range"
            id="split-slider"
            name="split"
            min="50"
            max="100"
            value={parseInt(split.split("_")[0])}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setSplit(`${value}_${100 - value}`);
            }}
          />
          <div className="slider-labels">
            <span>50%</span>
            <span className="slider-value">{split.split("_")[0]}% / {split.split("_")[1]}%</span>
            <span>100%</span>
          </div>
        </div>
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
  );
}

export function useSetupOverlayHandlers() {
  return {
    setSelectedLocation: (lat: number, lng: number) => {
      return { lat, lng };
    }
  };
}