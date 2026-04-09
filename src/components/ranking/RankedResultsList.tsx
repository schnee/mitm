"use client";

import type { RankedVenue } from "../../lib/api/session-client";
import type { VenueReactionSummary, VenueReactionType } from "../../lib/api/session-client";

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
  shortlistVenueIds,
  reactions,
  participantId,
  onReact,
  reactionPendingVenueIds,
  reactionStatusByVenueId
}: {
  results: RankedVenue[];
  onAddToShortlist?: (venue: RankedVenue) => void;
  shortlistVenueIds?: string[];
  reactions?: VenueReactionSummary[];
  participantId?: string;
  onReact?: (venue: RankedVenue, reaction: VenueReactionType) => void;
  reactionPendingVenueIds?: string[];
  reactionStatusByVenueId?: Record<string, string>;
}) {
  const shortlistedSet = new Set(shortlistVenueIds ?? []);
  const reactionByVenueId = new Map((reactions ?? []).map((item) => [item.venueId, item]));
  const pendingSet = new Set(reactionPendingVenueIds ?? []);

  return (
    <section>
      <h2>Ranked results</h2>
      {results.length === 0 && <p>No results yet. Save ranking inputs and run ranking.</p>}
      <ol>
        {results.map((result) => (
          <li key={result.venueId}>
            <h3>{result.name}</h3>
            <p>Fairness delta: {result.fairnessDeltaMinutes} min</p>
            <p>Lower fairness delta means more balanced travel burden.</p>
            <p>
              Fairness: {result.fairnessScore.toFixed(2)} | Preference: {result.preferenceScore.toFixed(2)} | Total: {result.totalScore.toFixed(2)}
            </p>
            <p>Category: {result.category}</p>
            <p>{renderOpenStatus(result.openNow)}</p>
            <p>ETA (You): {result.etaParticipantA} min</p>
            <p>ETA (Partner): {result.etaParticipantB} min</p>
            {onReact && (
              <div>
                <button
                  type="button"
                  onClick={() => onReact(result, "accept")}
                  disabled={pendingSet.has(result.venueId)}
                  aria-pressed={reactionByVenueId.get(result.venueId)?.reactionsByParticipant[participantId ?? ""] === "accept"}
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => onReact(result, "pass")}
                  disabled={pendingSet.has(result.venueId)}
                  aria-pressed={reactionByVenueId.get(result.venueId)?.reactionsByParticipant[participantId ?? ""] === "pass"}
                >
                  Pass
                </button>
                <p>
                  Accept {reactionByVenueId.get(result.venueId)?.acceptCount ?? 0} | Pass {reactionByVenueId.get(result.venueId)?.passCount ?? 0}
                </p>
                {reactionStatusByVenueId?.[result.venueId] && <p>{reactionStatusByVenueId[result.venueId]}</p>}
              </div>
            )}
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
