"use client";

import type { ConfirmedPlace } from "../../lib/api/session-client";

export function ConfirmedPlaceCard({ confirmedPlace }: { confirmedPlace: ConfirmedPlace }) {
  return (
    <section className="panel stage" aria-labelledby="confirmed-place-title">
      <header className="section-header">
        <h2 id="confirmed-place-title">Confirmed destination</h2>
        <p className="status-badge status-success">Success: the final decision is locked.</p>
      </header>
      <p>
        <strong>{confirmedPlace.name}</strong>
      </p>
      <div className="meta-grid">
        <p>Category: {confirmedPlace.category}</p>
        <p>Confirmed by: {confirmedPlace.confirmedByParticipantId}</p>
      </div>
      <div className="btn-row">
        <a className="btn-secondary" href={confirmedPlace.navigationUrl} target="_blank" rel="noreferrer">
          Open in Maps
        </a>
      </div>
    </section>
  );
}
