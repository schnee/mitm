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
    <section className="panel stage" aria-labelledby="ranked-results-title">
      <header className="section-header">
        <h2 id="ranked-results-title">Ranked results</h2>
        <p>Review the fairness rationale first, then react or shortlist quickly.</p>
      </header>
      {results.length === 0 && <p className="status-badge status-waiting">Waiting: no results yet. Save ranking inputs and run ranking.</p>}
      <ol className="card-list">
        {results.map((result) => (
          <li key={result.venueId} className="result-card">
            <h3>{result.name}</h3>
            <p className="status-badge status-idle">Fairness delta: {result.fairnessDeltaMinutes} min</p>
            <p className="muted">Lower fairness delta means a more balanced travel burden.</p>

            <div className="chip-list" aria-label="Score summary">
              <span className="chip">Fairness: {result.fairnessScore.toFixed(2)}</span>
              <span className="chip">Preference: {result.preferenceScore.toFixed(2)}</span>
              <span className="chip">Total: {result.totalScore.toFixed(2)}</span>
            </div>

            <div className="meta-grid">
              <p>Category: {result.category}</p>
              <p>{renderOpenStatus(result.openNow)}</p>
              <p>ETA (You): {result.etaParticipantA} min</p>
              <p>ETA (Partner): {result.etaParticipantB} min</p>
            </div>

            {onReact && (
              <div className="stage" aria-label="Reaction controls">
                <div className="btn-row">
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => onReact(result, "accept")}
                  disabled={pendingSet.has(result.venueId)}
                  aria-pressed={reactionByVenueId.get(result.venueId)?.reactionsByParticipant[participantId ?? ""] === "accept"}
                >
                  Accept
                </button>
                <button
                  className="btn-subtle"
                  type="button"
                  onClick={() => onReact(result, "pass")}
                  disabled={pendingSet.has(result.venueId)}
                  aria-pressed={reactionByVenueId.get(result.venueId)?.reactionsByParticipant[participantId ?? ""] === "pass"}
                >
                  Pass
                </button>
                </div>
                <p className="muted">
                  Accept {reactionByVenueId.get(result.venueId)?.acceptCount ?? 0} | Pass {reactionByVenueId.get(result.venueId)?.passCount ?? 0}
                </p>
                {reactionStatusByVenueId?.[result.venueId] && (
                  <p className="status-badge status-success" role="status" aria-live="polite">
                    {reactionStatusByVenueId[result.venueId]}
                  </p>
                )}
              </div>
            )}
            {onAddToShortlist && (
              <div className="btn-row">
                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => onAddToShortlist(result)}
                  disabled={shortlistedSet.has(result.venueId)}
                >
                  Add to shortlist
                </button>
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
