"use client";

import { useState } from "react";
import { upsertLocationDraft } from "../../lib/api/session-client";

type GeoErrorCode = "PERMISSION_DENIED" | "POSITION_UNAVAILABLE" | "TIMEOUT" | null;

export function LocationCaptureForm({
  sessionId,
  participantId,
  onDraftSaved
}: {
  sessionId: string;
  participantId: string;
  onDraftSaved: () => void;
}) {
  const [manualAddress, setManualAddress] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [coordinatesHint, setCoordinatesHint] = useState("");
  const [geoError, setGeoError] = useState<GeoErrorCode>(null);
  const [statusType, setStatusType] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("Idle: choose current location or save a manual location draft.");

  const handleCoordinatesChange = (value: string) => {
    setCoordinates(value);

    if (!value.trim()) {
      setCoordinatesHint("");
      return;
    }

    const match = value.match(/^\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*$/);
    if (!match) {
      setCoordinatesHint("Use format: 30.271371, -97.759000");
      return;
    }

    setLat(match[1]);
    setLng(match[2]);
    setCoordinatesHint("");
  };

  const saveManual = async () => {
    try {
      setStatusType("loading");
      setStatusMessage("Loading: saving manual location draft.");
      const parsedLat = Number.parseFloat(lat);
      const parsedLng = Number.parseFloat(lng);
      await upsertLocationDraft({
        mode: "manual",
        sessionId,
        participantId,
        lat: parsedLat,
        lng: parsedLng,
        addressLabel: manualAddress
      });
      setStatusType("success");
      setStatusMessage("Success: manual location draft saved.");
      setGeoError(null);
      onDraftSaved();
    } catch {
      setStatusType("error");
      setStatusMessage("Error: unable to save manual location. Check your inputs and retry.");
    }
  };

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeoError("POSITION_UNAVAILABLE");
      setStatusType("error");
      setStatusMessage("Error: geolocation is unavailable. Use manual entry to continue.");
      return;
    }

    setStatusType("loading");
    setStatusMessage("Loading: requesting your current location.");

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
          setStatusMessage("Success: current location draft saved.");
          setGeoError(null);
          onDraftSaved();
        } catch {
          setStatusType("error");
          setStatusMessage("Error: unable to save current location. Use manual entry to continue.");
        }
      },
      (error) => {
        if (error.code === 1) {
          setGeoError("PERMISSION_DENIED");
        } else if (error.code === 2) {
          setGeoError("POSITION_UNAVAILABLE");
        } else {
          setGeoError("TIMEOUT");
        }
        setStatusType("error");
        setStatusMessage("Error: geolocation was not available. Use manual entry below to continue.");
      },
      { timeout: 10_000 }
    );
  };

  const statusClass =
    statusType === "loading"
      ? "status-loading"
      : statusType === "success"
        ? "status-success"
        : statusType === "error"
          ? "status-error"
          : "status-idle";

  return (
    <section className="panel stage" aria-labelledby="location-capture-title">
      <header className="section-header">
        <h2 id="location-capture-title">Location capture</h2>
        <p>Pick your location input method. Manual entry is always available as fallback.</p>
      </header>

      <div className="btn-row">
        <button className="btn-secondary" type="button" onClick={useCurrentLocation}>
          Use current location
        </button>
      </div>
      {geoError && (
        <p className="status-badge status-error" role="status" aria-live="polite">
          Error: geolocation issue ({geoError}). Use manual entry below to continue without blocking the flow.
        </p>
      )}

      <div className="panel input-stack">
        <h3>Manual entry</h3>
        <label htmlFor="manual-address-input">Address label</label>
        <input
          id="manual-address-input"
          value={manualAddress}
          onChange={(event) => setManualAddress(event.target.value)}
          placeholder="Address label"
        />
        <label htmlFor="coordinates-input">
          Coordinates (lat, lng)
          <input
            id="coordinates-input"
            value={coordinates}
            onChange={(event) => handleCoordinatesChange(event.target.value)}
            placeholder="30.271371, -97.759000"
          />
        </label>
        {coordinatesHint && <p className="muted">Waiting: {coordinatesHint}</p>}
        <label htmlFor="latitude-input">Latitude</label>
        <input id="latitude-input" value={lat} onChange={(event) => setLat(event.target.value)} placeholder="Latitude" />
        <label htmlFor="longitude-input">Longitude</label>
        <input id="longitude-input" value={lng} onChange={(event) => setLng(event.target.value)} placeholder="Longitude" />
        <button
          className="btn-primary"
          type="button"
          onClick={() => {
            void saveManual();
          }}
          disabled={!manualAddress || !lat || !lng}
        >
          Save manual location
        </button>
      </div>

      <p className={`status-badge ${statusClass}`} role="status" aria-live="polite">
        {statusMessage}
      </p>
    </section>
  );
}
