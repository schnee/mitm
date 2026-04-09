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
  const [statusMessage, setStatusMessage] = useState("Awaiting location input");

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
    setStatusMessage("Manual location draft saved");
    onDraftSaved();
  };

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeoError("POSITION_UNAVAILABLE");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await upsertLocationDraft({
          mode: "geolocation",
          sessionId,
          participantId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          addressLabel: "Current location"
        });
        setStatusMessage("Current location draft saved");
        onDraftSaved();
      },
      (error) => {
        if (error.code === 1) {
          setGeoError("PERMISSION_DENIED");
          return;
        }
        if (error.code === 2) {
          setGeoError("POSITION_UNAVAILABLE");
          return;
        }
        setGeoError("TIMEOUT");
      },
      { timeout: 10_000 }
    );
  };

  return (
    <section>
      <h2>Location capture</h2>
      <button type="button" onClick={useCurrentLocation}>
        Use current location
      </button>
      {geoError && (
        <p>
          Geolocation issue ({geoError}). Use manual entry below to continue without blocking the flow.
        </p>
      )}
      <div>
        <h3>Manual entry</h3>
        <input
          value={manualAddress}
          onChange={(event) => setManualAddress(event.target.value)}
          placeholder="Address label"
        />
        <label>
          Coordinates (lat, lng)
          <input
            value={coordinates}
            onChange={(event) => handleCoordinatesChange(event.target.value)}
            placeholder="30.271371, -97.759000"
          />
        </label>
        {coordinatesHint && <p>{coordinatesHint}</p>}
        <input value={lat} onChange={(event) => setLat(event.target.value)} placeholder="Latitude" />
        <input value={lng} onChange={(event) => setLng(event.target.value)} placeholder="Longitude" />
        <button
          type="button"
          onClick={() => {
            void saveManual();
          }}
          disabled={!manualAddress || !lat || !lng}
        >
          Save manual location
        </button>
      </div>
      <p>{statusMessage}</p>
    </section>
  );
}
