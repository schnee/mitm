"use client";

import type { ConfirmedPlace, ShortlistVenue } from "../../lib/api/session-client";

export function ShortlistPanel({
  shortlist,
  confirmedPlace,
  onConfirm
}: {
  shortlist: ShortlistVenue[];
  confirmedPlace: ConfirmedPlace | null;
  onConfirm: (venueId: string) => void;
}) {
  if (shortlist.length === 0) {
    return (
      <section className="panel stage" aria-labelledby="shortlist-title-empty">
        <h2 id="shortlist-title-empty">Shared shortlist</h2>
        <p className="status-badge status-waiting">Waiting: no places shortlisted yet.</p>
      </section>
    );
  }

  return (
    <section className="panel stage" aria-labelledby="shortlist-title">
      <header className="section-header">
        <h2 id="shortlist-title">Shared shortlist</h2>
        <p>Review shortlisted options and confirm one final place together.</p>
      </header>
      <ul className="card-list">
        {shortlist.map((venue) => {
          const isConfirmed = confirmedPlace?.venueId === venue.venueId;
          const isLockedByDifferentPlace = Boolean(confirmedPlace && !isConfirmed);

          return (
            <li key={venue.venueId} className="result-card">
              <h3>{venue.name}</h3>
              <div className="meta-grid">
                <p>Category: {venue.category}</p>
                <p>ETA (You): {venue.etaParticipantA} min</p>
                <p>ETA (Partner): {venue.etaParticipantB} min</p>
              </div>
              <button
                className="btn-primary"
                type="button"
                onClick={() => onConfirm(venue.venueId)}
                disabled={isLockedByDifferentPlace}
              >
                Confirm this place
              </button>
              {isConfirmed && <p className="status-badge status-success">Success: final place confirmed.</p>}
              {isLockedByDifferentPlace && !isConfirmed && (
                <p className="status-badge status-waiting">Waiting: another place is already confirmed for this session.</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
