"use client";

import type { RankedVenue, VenueReactionSummary, VenueReactionType } from "../../lib/api/session-client";

interface SpotsListOverlayProps {
  results: RankedVenue[];
  shortlistVenueIds: string[];
  confirmedVenueId: string | null;
  reactions: VenueReactionSummary[];
  participantId: string | undefined;
  reactionPendingVenueIds: string[];
  reactionStatusByVenueId: Record<string, string>;
  selectedVenueId: string | null;
  focusedVenueId: string | null;
  onAddToShortlist?: (venue: RankedVenue) => void;
  onReact?: (venue: RankedVenue, reaction: VenueReactionType) => void;
  onVenueFocus?: (venueId: string) => void;
  rankingStatus: string;
  onRefresh?: () => void;
  refreshDisabled?: boolean;
  showRefresh?: boolean;
}

function renderOpenStatus(openNow: boolean | null): string {
  if (openNow === true) return "Open now";
  if (openNow === false) return "Closed now";
  return "Unknown";
}

function getCardState(
  venueId: string,
  selectedVenueId: string | null,
  shortlistedSet: Set<string>,
  confirmedSet: Set<string>,
  focusedVenueId: string | null
): "confirmed" | "shortlisted" | "focused" | "selected" | "default" {
  if (confirmedSet.has(venueId)) return "confirmed";
  if (shortlistedSet.has(venueId)) return "shortlisted";
  if (focusedVenueId === venueId) return "focused";
  if (selectedVenueId === venueId) return "selected";
  return "default";
}

export function SpotsListOverlay({
  results,
  shortlistVenueIds,
  confirmedVenueId,
  reactions,
  participantId,
  reactionPendingVenueIds,
  reactionStatusByVenueId,
  selectedVenueId,
  focusedVenueId,
  onAddToShortlist,
  onReact,
  onVenueFocus,
  rankingStatus,
  onRefresh,
  refreshDisabled = false,
  showRefresh = true
}: SpotsListOverlayProps) {
  const shortlistedSet = new Set(shortlistVenueIds);
  const confirmedSet = confirmedVenueId ? new Set([confirmedVenueId]) : new Set<string>();
  const reactionByVenueId = new Map(reactions.map((item) => [item.venueId, item]));
  const pendingSet = new Set(reactionPendingVenueIds);

  return (
    <div className="overlay-panel spots-list-overlay">
      <header className="section-header">
        <h2>Ranked spots</h2>
        <p>Review fairness scores and add to your shortlist.</p>
      </header>

      {showRefresh && (
        <>
          <p className="status-badge status-waiting" role="status" aria-live="polite">
            {rankingStatus}
          </p>
          <div className="btn-row">
            <button
              className="btn-secondary"
              type="button"
              disabled={refreshDisabled}
              onClick={() => {
                void onRefresh?.();
              }}
            >
              Refresh suggestions
            </button>
          </div>
        </>
      )}

      {results.length === 0 && (
        <p className="status-badge status-waiting">
          Waiting: no shared spots yet. Save meet-up preferences and wait for suggestions.
        </p>
      )}

      <ol className="card-list compact">
        {results.map((result, index) => {
          const cardState = getCardState(
            result.venueId,
            selectedVenueId,
            shortlistedSet,
            confirmedSet,
            focusedVenueId
          );
          const isSelected = selectedVenueId === result.venueId;
          const isShortlisted = shortlistedSet.has(result.venueId);
          const isConfirmed = confirmedSet.has(result.venueId);

          return (
            <li
              key={result.venueId}
              className={`result-card ${isSelected ? "result-card-selected" : ""} ${isShortlisted ? "result-card-shortlisted" : ""} ${isConfirmed ? "result-card-confirmed" : ""}`}
            >
              {cardState !== "default" && cardState !== "focused" && (
                <span className={`state-badge state-badge-${cardState}`}>
                  {cardState === "confirmed" ? "Confirmed" : cardState === "shortlisted" ? "Shortlisted" : "Selected"}
                </span>
              )}
              <h3>{index + 1}. {result.name}</h3>
              <p className="muted">{result.category} · Δ {result.fairnessDeltaMinutes} min</p>

              <div className="chip-list">
                <span className="chip">You: {result.etaParticipantA > 60 ? `${Math.round(result.etaParticipantA / 60)}h` : `${result.etaParticipantA} min`}</span>
                <span className="chip">Partner: {result.etaParticipantB > 60 ? `${Math.round(result.etaParticipantB / 60)}h` : `${result.etaParticipantB} min`}</span>
              </div>

              {onReact && (
                <div className="btn-row">
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => onReact(result, "accept")}
                    disabled={pendingSet.has(result.venueId)}
                  >
                    Accept
                  </button>
                  <button
                    className="btn-subtle"
                    type="button"
                    onClick={() => onReact(result, "pass")}
                    disabled={pendingSet.has(result.venueId)}
                  >
                    Pass
                  </button>
                </div>
              )}

              {onAddToShortlist && (
                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => onAddToShortlist(result)}
                  disabled={shortlistedSet.has(result.venueId)}
                >
                  {isShortlisted ? "Added" : "Add to shortlist"}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}