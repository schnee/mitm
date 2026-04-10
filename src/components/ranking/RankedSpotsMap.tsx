"use client";

import type { RankedVenue } from "../../lib/api/session-client";

function markerClassName(input: {
  venueId: string;
  selectedVenueId: string | null;
  shortlistVenueIds: string[];
  confirmedVenueId: string | null;
}): string {
  if (input.confirmedVenueId === input.venueId) {
    return "marker-confirmed";
  }
  if (input.shortlistVenueIds.includes(input.venueId)) {
    return "marker-shortlisted";
  }
  if (input.selectedVenueId === input.venueId) {
    return "marker-selected";
  }
  return "marker-default";
}

export function RankedSpotsMap({
  results,
  shortlistVenueIds,
  confirmedVenueId,
  selectedVenueId,
  onMarkerSelect
}: {
  results: RankedVenue[];
  shortlistVenueIds: string[];
  confirmedVenueId: string | null;
  selectedVenueId: string | null;
  onMarkerSelect: (venueId: string) => void;
}) {
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <section className="panel stage map-container" aria-label="Ranked spots map">
      <h3>Ranked spots map</h3>
      {!mapsApiKey && (
        <p className="status-badge status-waiting">
          Waiting: set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable interactive map markers. List-only mode remains available.
        </p>
      )}
      <p className="muted">Interactive marker list is synchronized with the ranked spots list.</p>
      <div className="map-marker-grid" role="list">
        {results.map((result) => {
          const markerState = markerClassName({
            venueId: result.venueId,
            selectedVenueId,
            shortlistVenueIds,
            confirmedVenueId
          });
          return (
            <button
              key={result.venueId}
              className={`chip ${markerState}`}
              type="button"
              role="listitem"
              tabIndex={0}
              aria-label={`${result.name} marker ${markerState}`}
              onClick={() => onMarkerSelect(result.venueId)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onMarkerSelect(result.venueId);
                }
              }}
            >
              {result.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}
