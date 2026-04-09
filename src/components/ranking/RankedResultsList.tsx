"use client";

import type { RankedVenue } from "../../lib/api/session-client";

function renderOpenStatus(openNow: boolean | null): string {
  if (openNow === true) {
    return "Open now";
  }
  if (openNow === false) {
    return "Closed now";
  }
  return "Open status unavailable";
}

export function RankedResultsList({
  results,
  onAddToShortlist,
  shortlistVenueIds
}: {
  results: RankedVenue[];
  onAddToShortlist?: (venue: RankedVenue) => void;
  shortlistVenueIds?: string[];
}) {
  const shortlistedSet = new Set(shortlistVenueIds ?? []);

  return (
    <section>
      <h2>Ranked results</h2>
      {results.length === 0 && <p>No results yet. Save ranking inputs and run ranking.</p>}
      <ol>
        {results.map((result) => (
          <li key={result.venueId}>
            <h3>{result.name}</h3>
            <p>Category: {result.category}</p>
            <p>{renderOpenStatus(result.openNow)}</p>
            <p>ETA (You): {result.etaParticipantA} min</p>
            <p>ETA (Partner): {result.etaParticipantB} min</p>
            {onAddToShortlist && (
              <button type="button" onClick={() => onAddToShortlist(result)} disabled={shortlistedSet.has(result.venueId)}>
                Add to shortlist
              </button>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
