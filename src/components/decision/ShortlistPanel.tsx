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
      <section>
        <h2>Shared shortlist</h2>
        <p>No places shortlisted yet.</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Shared shortlist</h2>
      <ul>
        {shortlist.map((venue) => {
          const isConfirmed = confirmedPlace?.venueId === venue.venueId;
          const isLockedByDifferentPlace = Boolean(confirmedPlace && !isConfirmed);

          return (
            <li key={venue.venueId}>
              <h3>{venue.name}</h3>
              <p>Category: {venue.category}</p>
              <p>ETA (You): {venue.etaParticipantA} min</p>
              <p>ETA (Partner): {venue.etaParticipantB} min</p>
              <button
                type="button"
                onClick={() => onConfirm(venue.venueId)}
                disabled={isLockedByDifferentPlace}
              >
                Confirm this place
              </button>
              {isConfirmed && <p>Final place confirmed.</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
