"use client";

import type { ConfirmedPlace } from "../../lib/api/session-client";

interface ConfirmOverlayProps {
  confirmedPlace: ConfirmedPlace;
}

export function ConfirmOverlay({ confirmedPlace }: ConfirmOverlayProps) {
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(confirmedPlace.name)}`;

  return (
    <div className="overlay-panel confirm-overlay">
      <header className="section-header">
        <h2>Confirmed!</h2>
        <p>You've agreed to meet here:</p>
      </header>

      <div className="confirmed-card">
        <h3>{confirmedPlace.name}</h3>
        <p className="muted">{confirmedPlace.category}</p>
      </div>

      <div className="btn-row">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          Get Directions
        </a>
      </div>

      <p className="muted">
        Share this link with your partner to coordinate arrival.
      </p>
    </div>
  );
}