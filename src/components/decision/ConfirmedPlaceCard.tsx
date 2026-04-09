"use client";

import type { ConfirmedPlace } from "../../lib/api/session-client";

export function ConfirmedPlaceCard({ confirmedPlace }: { confirmedPlace: ConfirmedPlace }) {
  return (
    <section>
      <h2>Confirmed destination</h2>
      <p>{confirmedPlace.name}</p>
      <p>Category: {confirmedPlace.category}</p>
      <p>Confirmed by: {confirmedPlace.confirmedByParticipantId}</p>
      <a href={confirmedPlace.navigationUrl} target="_blank" rel="noreferrer">
        Open in Maps
      </a>
    </section>
  );
}
