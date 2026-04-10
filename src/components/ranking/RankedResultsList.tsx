"use client";

import { useEffect, useRef, useCallback } from "react";
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
  reactionStatusByVenueId,
  selectedVenueId,
  onVenueFocus
}: {
  results: RankedVenue[];
  onAddToShortlist?: (venue: RankedVenue) => void;
  shortlistVenueIds?: string[];
  reactions?: VenueReactionSummary[];
  participantId?: string;
  onReact?: (venue: RankedVenue, reaction: VenueReactionType) => void;
  reactionPendingVenueIds?: string[];
  reactionStatusByVenueId?: Record<string, string>;
  selectedVenueId?: string | null;
  onVenueFocus?: (venueId: string) => void;
}) {
  const shortlistedSet = new Set(shortlistVenueIds ?? []);
  const reactionByVenueId = new Map((reactions ?? []).map((item) => [item.venueId, item]));
  const pendingSet = new Set(reactionPendingVenueIds ?? []);
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  // Scroll to selected card when selectedVenueId changes
  useEffect(() => {
    if (selectedVenueId) {
      const element = itemRefs.current.get(selectedVenueId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedVenueId]);

  const setRef = useCallback((venueId: string) => (el: HTMLLIElement | null) => {
    if (el) {
      itemRefs.current.set(venueId, el);
    } else {
      itemRefs.current.delete(venueId);
    }
  }, []);

  const getCardState = (venueId: string): "confirmed" | "shortlisted" | "selected" | "default" => {
    if (shortlistVenueIds?.includes(venueId)) {
      return "shortlisted";
    }
    if (selectedVenueId === venueId) {
      return "selected";
    }
    return "default";
  };

  return (
    <section className="panel stage" aria-labelledby="ranked-results-title">
      <header className="section-header">
        <h2 id="ranked-results-title">Ranked spots</h2>
        <p>Review the fairness rationale first, then react or shortlist quickly.</p>
      </header>
      {results.length === 0 && <p className="status-badge status-waiting">Waiting: no shared spots yet. Save meet-up preferences and wait for suggestions, or use Refresh suggestions.</p>}
      <ol className="card-list">
        {results.map((result) => {
          const cardState = getCardState(result.venueId);
          const isSelected = selectedVenueId === result.venueId;
          const isShortlisted = shortlistedSet.has(result.venueId);
          
          return (
            <li 
              key={result.venueId} 
              ref={setRef(result.venueId)}
              className={`result-card ${isSelected ? "result-card-selected" : ""} ${isShortlisted ? "result-card-shortlisted" : ""}`}
            >
              {(isSelected || isShortlisted) && (
                <span className={`state-badge state-badge-${cardState}`}>
                  {cardState === "shortlisted" ? "Shortlisted" : isSelected ? "Selected" : ""}
                </span>
              )}
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
                  {onVenueFocus && (
                    <button className="btn-subtle" type="button" onClick={() => onVenueFocus(result.venueId)}>
                      Focus on map
                    </button>
                  )}
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
          );
        })}
      </ol>
    </section>
  );
}