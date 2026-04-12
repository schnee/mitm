"use client";

import type { ShortlistVenue, ConfirmedPlace } from "../../lib/api/session-client";

interface ShortlistOverlayProps {
  shortlist: ShortlistVenue[];
  confirmedPlace: ConfirmedPlace | null;
  onConfirm: (venueId: string) => void;
  decisionStatus: string;
}

function renderEta(minutes: number): string {
  if (minutes > 60) {
    return `${Math.round(minutes / 60)}h`;
  }
  return `${minutes} min`;
}

export function ShortlistOverlay({ shortlist, confirmedPlace, onConfirm, decisionStatus }: ShortlistOverlayProps) {
  return (
    <div className="overlay-panel shortlist-overlay">
      <header className="section-header">
        <h2>Your shortlist</h2>
        <p>Pick a spot to confirm for both of you.</p>
      </header>

      <p className="status-badge status-idle" role="status" aria-live="polite">
        {decisionStatus}
      </p>

      {shortlist.length === 0 ? (
        <p className="status-badge status-waiting">
          No spots shortlisted yet. Go back to ranked spots and add some!
        </p>
      ) : (
        <ol className="card-list">
          {shortlist.map((venue) => {
            const isConfirmed = confirmedPlace?.venueId === venue.venueId;
            return (
              <li key={venue.venueId} className={`result-card ${isConfirmed ? "result-card-confirmed" : ""}`}>
                {isConfirmed && (
                  <span className="state-badge state-badge-confirmed">Confirmed</span>
                )}
                <h3>{venue.name}</h3>
                <p className="muted">{venue.category}</p>
                <div className="chip-list">
                  <span className="chip">You: {renderEta(venue.etaParticipantA)}</span>
                  <span className="chip">Partner: {renderEta(venue.etaParticipantB)}</span>
                </div>
                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => onConfirm(venue.venueId)}
                  disabled={Boolean(confirmedPlace)}
                >
                  {isConfirmed ? "Confirmed!" : "Confirm this place"}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}