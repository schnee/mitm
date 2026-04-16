"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  confirmVenue,
  getRankedResults,
  joinSessionByToken,
  type ConfirmedPlace,
  type RankingLifecycleState,
  type RankedVenue,
  type ShortlistVenue,
  type VenueReactionSummary,
  type VenueReactionType,
  upsertVenueReaction,
  upsertShortlistVenue
} from "../../../lib/api/session-client";
import { useSessionSync } from "../../../hooks/useSessionSync";

import { ParticipantStatus } from "../../../components/session/ParticipantStatus";
import { SetupOverlay } from "../../../components/overlays/SetupOverlay";
import { PersistentMap, type MapStage } from "../../../components/map/PersistentMap";
import { SpotsListOverlay } from "../../../components/overlays/SpotsListOverlay";
import { ShortlistOverlay } from "../../../components/overlays/ShortlistOverlay";
import { ConfirmOverlay } from "../../../components/overlays/ConfirmOverlay";
import { deriveSessionFlow, deriveMapStage } from "../../../lib/session-flow";
import { deriveDraftReady, derivePreferencesSaved } from "../../../lib/session-continuity";

const BANNER_DESKTOP = "/images/mmitm-desktop.webp";
const BANNER_MOBILE = "/images/mmitm-mobile.webp";

type JoinState = "joining" | "joined" | "join_error";

interface JoinPageProps {
  params: Promise<{
    token: string;
  }>;
}

interface HostSessionContext {
  sessionId: string;
  participantId: string;
}

function applyOptimisticReaction(
  reactions: VenueReactionSummary[],
  input: { venueId: string; participantId: string; reaction: VenueReactionType }
): VenueReactionSummary[] {
  const next = reactions.map((item) => ({ ...item, reactionsByParticipant: { ...item.reactionsByParticipant } }));
  const existing = next.find((item) => item.venueId === input.venueId);
  const target =
    existing ??
    (() => {
      const created: VenueReactionSummary = {
        venueId: input.venueId,
        acceptCount: 0,
        passCount: 0,
        reactionsByParticipant: {}
      };
      next.push(created);
      return created;
    })();

  target.reactionsByParticipant[input.participantId] = input.reaction;
  const values = Object.values(target.reactionsByParticipant);
  target.acceptCount = values.filter((value) => value === "accept").length;
  target.passCount = values.filter((value) => value === "pass").length;

  return next;
}

function buildReactionStatusByVenueId(
  reactions: VenueReactionSummary[],
  participantId: string | null,
  partnerParticipantId: string | null
): Record<string, string> {
  if (!participantId) {
    return {};
  }

  return reactions.reduce<Record<string, string>>((acc, item) => {
    const myReaction = item.reactionsByParticipant[participantId];
    const partnerReaction = partnerParticipantId ? item.reactionsByParticipant[partnerParticipantId] : undefined;

    if (myReaction && partnerReaction) {
      acc[item.venueId] = `You ${myReaction}ed. Partner ${partnerReaction}ed.`;
      return acc;
    }

    if (myReaction) {
      acc[item.venueId] = `You ${myReaction}ed.`;
      return acc;
    }

    if (partnerReaction) {
      acc[item.venueId] = `Partner ${partnerReaction}ed.`;
    }

    return acc;
  }, {});
}

export default function JoinPage({ params }: JoinPageProps) {
  const [state, setState] = useState<JoinState>("joining");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null);
  const [rankingStatus, setRankingStatus] = useState("Waiting: save meet-up preferences to start shared suggestions.");
  const [myPreferencesSaved, setMyPreferencesSaved] = useState(false);
  const [rankingRefreshPending, setRankingRefreshPending] = useState(false);
  const [localRankedResults, setLocalRankedResults] = useState<RankedVenue[]>([]);
  const [localShortlist, setLocalShortlist] = useState<ShortlistVenue[]>([]);
  const [localReactions, setLocalReactions] = useState<VenueReactionSummary[]>([]);
  const [reactionPendingVenueIds, setReactionPendingVenueIds] = useState<string[]>([]);
  const [localConfirmedPlace, setLocalConfirmedPlace] = useState<ConfirmedPlace | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [focusedVenueId, setFocusedVenueId] = useState<string | null>(null);
  const [decisionStatus, setDecisionStatus] = useState("Idle: add a ranked spot to shortlist to begin deciding.");
  const { token } = use(params);
  const searchParams = useSearchParams();
  const sync = useSessionSync(sessionId);

  useEffect(() => {
    let active = true;

    const run = async () => {
      const isHostContinuation = searchParams.get("asHost") === "1";

      if (isHostContinuation) {
        const hostSessionId = searchParams.get("sessionId");
        const hostParticipantId = searchParams.get("participantId");
        const hostSessionStorageKey = `host-session:${token}`;

        if (hostSessionId && hostParticipantId) {
          const hostSession: HostSessionContext = {
            sessionId: hostSessionId,
            participantId: hostParticipantId
          };

          localStorage.setItem(hostSessionStorageKey, JSON.stringify(hostSession));
          sessionStorage.setItem("sessionId", hostSession.sessionId);
          sessionStorage.setItem("participantId", hostSession.participantId);
          setSessionId(hostSession.sessionId);
          setParticipantId(hostSession.participantId);
          if (active) {
            setState("joined");
          }
          return;
        }

        const hostSessionRaw = localStorage.getItem(hostSessionStorageKey);
        if (hostSessionRaw) {
          try {
            const hostSession = JSON.parse(hostSessionRaw) as HostSessionContext;
            if (!hostSession.sessionId || !hostSession.participantId) {
              throw new Error("Invalid host session context");
            }

            sessionStorage.setItem("sessionId", hostSession.sessionId);
            sessionStorage.setItem("participantId", hostSession.participantId);
            setSessionId(hostSession.sessionId);
            setParticipantId(hostSession.participantId);
            if (active) {
              setState("joined");
            }
            return;
          } catch {
            localStorage.removeItem(hostSessionStorageKey);
          }
        }
      }

      try {
        const joined = await joinSessionByToken(token);
        sessionStorage.setItem("sessionId", joined.sessionId);
        sessionStorage.setItem("participantId", joined.participantId);
        setSessionId(joined.sessionId);
        setParticipantId(joined.participantId);
        if (active) {
          setState("joined");
        }
      } catch {
        if (active) {
          setState("join_error");
        }
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [searchParams, token]);

  const refreshRanking = async () => {
    if (!sessionId || !sync.snapshot?.rankingInputsReady) {
      return;
    }

    setRankingRefreshPending(true);
    setRankingStatus("Loading: refreshing shared suggestions.");
    try {
      const response = await getRankedResults(sessionId);
      
      // D-09: Preserve selected venue if still in results, otherwise clear
      const newResults = response.results;
      if (selectedVenueId && !newResults.some(r => r.venueId === selectedVenueId)) {
        // Selected venue no longer exists in results - clear selection or select first
        if (newResults.length > 0) {
          setSelectedVenueId(newResults[0].venueId);
        } else {
          setSelectedVenueId(null);
        }
      }
      
      setLocalRankedResults(response.results);
      setRankingStatus(`Success: shared suggestions refreshed at ${response.generatedAt}`);
    } catch {
      setRankingStatus("Error: unable to refresh suggestions right now. Saved locations and meet-up preferences are still preserved.");
    } finally {
      setRankingRefreshPending(false);
    }
  };

  const snapshotShortlist = sync.snapshot?.shortlist ?? [];
  const snapshotReactions = sync.snapshot?.reactions ?? [];
  const snapshotRankedResults = sync.snapshot?.rankedResults ?? [];

  const shortlist = snapshotShortlist.length >= localShortlist.length ? snapshotShortlist : localShortlist;
  const confirmedPlace = sync.snapshot?.confirmedPlace ?? localConfirmedPlace;
  const reactions = snapshotReactions.length >= localReactions.length ? snapshotReactions : localReactions;
  const rankedResults =
    snapshotRankedResults.length >= localRankedResults.length ? snapshotRankedResults : localRankedResults;
  const rankingLifecycleState: RankingLifecycleState = sync.snapshot?.rankingLifecycle?.state ?? "waiting";
  const partnerParticipantId =
    sync.snapshot?.participants.find((item) => item.participantId !== participantId)?.participantId ?? null;
  const me = sync.snapshot?.participants.find((item) => item.participantId === participantId) ?? null;
  const partner = sync.snapshot?.participants.find((item) => item.participantId !== participantId) ?? null;
  const myDraftReady = deriveDraftReady(me?.locationDraftUpdatedAt, draftSaved);
  const myPreferencesPersisted = derivePreferencesSaved(me?.rankingInputsUpdatedAt, myPreferencesSaved);
  const reactionStatusByVenueId = buildReactionStatusByVenueId(reactions, participantId, partnerParticipantId);

  const flow = deriveSessionFlow({
    myLocationConfirmed: Boolean(me?.locationConfirmedAt),
    partnerLocationConfirmed: Boolean(partner?.locationConfirmedAt),
    myPreferencesSaved: myPreferencesPersisted,
    partnerPreferencesSaved: Boolean(partner?.rankingInputsUpdatedAt),
    rankedResultsCount: rankedResults.length,
    shortlistCount: shortlist.length,
    confirmedVenueId: confirmedPlace?.venueId ?? null
  });
  const { activeStepId, steps } = flow;

  const nextActionLabel =
    activeStepId === "location"
      ? "Complete setup"
      : activeStepId === "spots"
        ? "Review ranked spots"
        : activeStepId === "shortlist"
          ? "Pick shortlist spot"
          : "Confirm final place";

  const nextActionStatus: "idle" | "loading" | "waiting" | "success" | "error" =
    rankingLifecycleState === "failed"
      ? "error"
      : rankingLifecycleState === "generating"
        ? "loading"
        : activeStepId === "confirm" && confirmedPlace
          ? "success"
          : "waiting";

  const addToShortlist = async (venue: RankedVenue) => {
    if (!sessionId || !participantId) {
      return;
    }

    try {
      const response = await upsertShortlistVenue({
        sessionId,
        participantId,
        venueId: venue.venueId,
        name: venue.name,
        category: venue.category,
        openNow: venue.openNow,
        lat: venue.lat,
        lng: venue.lng,
        etaParticipantA: venue.etaParticipantA,
        etaParticipantB: venue.etaParticipantB
      });
      setLocalShortlist(response.shortlist);
      setDecisionStatus("Success: shortlist updated.");
    } catch {
      setDecisionStatus("Error: unable to update shortlist right now.");
    }
  };

  const confirmShortlistedVenue = async (venueId: string) => {
    if (!sessionId || !participantId) {
      return;
    }

    try {
      const response = await confirmVenue({ sessionId, participantId, venueId });
      setLocalConfirmedPlace(response.confirmedPlace);
      setDecisionStatus("Success: place confirmed.");
    } catch {
      setDecisionStatus("Error: this session already has a different confirmed place.");
    }
  };

  const reactToVenue = async (venue: RankedVenue, reaction: VenueReactionType) => {
    if (!sessionId || !participantId) {
      return;
    }

    setReactionPendingVenueIds((current) => Array.from(new Set([...current, venue.venueId])));
    setLocalReactions((current) =>
      applyOptimisticReaction(current.length > 0 ? current : reactions, {
        venueId: venue.venueId,
        participantId,
        reaction
      })
    );

    try {
      const response = await upsertVenueReaction({
        sessionId,
        venueId: venue.venueId,
        participantId,
        reaction
      });
      setLocalReactions((current) => {
        const remaining = current.filter((item) => item.venueId !== response.reaction.venueId);
        return [...remaining, response.reaction];
      });
      setDecisionStatus(`Success: you ${reaction}ed ${venue.name}.`);
    } catch {
      setDecisionStatus("Error: unable to save your reaction right now.");
    } finally {
      setReactionPendingVenueIds((current) => current.filter((item) => item !== venue.venueId));
    }
  };

  const rankingStatusClass = rankingStatus.startsWith("Success")
    ? "status-success"
    : rankingStatus.startsWith("Error")
      ? "status-error"
      : rankingStatus.startsWith("Loading")
        ? "status-loading"
        : "status-waiting";

  const sharedLifecycleStatus =
    rankingLifecycleState === "failed"
      ? "Error: partner-save sync delayed, retry available"
      : rankingLifecycleState === "ready"
        ? "Success: both participants can proceed to shortlist"
        : rankingLifecycleState === "generating"
          ? "Loading shared suggestions from both saved preferences"
          : "Waiting for partner to confirm location";

  const sharedLifecycleStatusClass =
    rankingLifecycleState === "failed"
      ? "status-error"
      : rankingLifecycleState === "ready"
        ? "status-success"
        : rankingLifecycleState === "generating"
          ? "status-loading"
          : "status-waiting";

  const decisionStatusClass = decisionStatus.startsWith("Success")
    ? "status-success"
    : decisionStatus.startsWith("Error")
      ? "status-error"
      : decisionStatus.startsWith("Loading")
        ? "status-loading"
        : decisionStatus.startsWith("Waiting")
          ? "status-waiting"
          : "status-idle";

  const syncStatusClass =
    sync.syncState === "reconnecting" || sync.error ? "status-error" : sync.syncState === "syncing" ? "status-loading" : "status-success";

const mapStage: MapStage = confirmedPlace ? "confirm" : deriveMapStage(activeStepId);
  const confirmedVenueId = confirmedPlace ? confirmedPlace.venueId : null;
  
  const hasSetupCompleted = me?.locationConfirmedAt != null || draftSaved || myPreferencesSaved || rankedResults.length > 0;
  const userLocation = me?.lat && me?.lng ? { lat: me.lat, lng: me.lng } : null;

  const handleMapClick = (lat: number, lng: number) => {
    if (mapStage === "setup") {
      setSelectedLocation({ lat, lng });
    } else if (mapStage === "spots" || mapStage === "shortlist" || mapStage === "confirm") {
      setSelectedVenueId(`${lat}-${lng}`);
    }
  };

  return (
    <main>
      <div className="app-shell page-stack">
        {state === "joining" && <p className="status-badge status-loading">Loading: joining session.</p>}

        {state === "joined" && (
          <>
            <header className="app-header">
              <img
                src={BANNER_DESKTOP}
                srcSet={`${BANNER_MOBILE} 375w, ${BANNER_DESKTOP} 1440w`}
                sizes="(max-width: 768px) 100vw, 1440px"
                alt="Meet Me In The Middle banner"
                className="banner-hero"
              />
            </header>
            <div className="map-first-layout">
              <section className="map-section">
                <PersistentMap
                  stage={mapStage}
                  userLocation={userLocation}
                  clickedLocation={selectedLocation}
                  results={rankedResults}
                  shortlistVenueIds={shortlist.map((item) => item.venueId)}
                  confirmedVenueId={confirmedPlace?.venueId ?? null}
                  confirmedVenueLocation={confirmedPlace ? { lat: confirmedPlace.lat, lng: confirmedPlace.lng } : null}
                  selectedVenueId={selectedVenueId}
                  focusedVenueId={focusedVenueId}
                  onMarkerSelect={(venueId) => setSelectedVenueId(venueId)}
                  onVenueFocus={(venueId) => setFocusedVenueId(venueId)}
                  onMapClick={handleMapClick}
                />
              </section>

              <aside className="overlay-section">
                {mapStage === "setup" && !hasSetupCompleted && sessionId && participantId ? (
                  <SetupOverlay
                    sessionId={sessionId}
                    participantId={participantId}
                    selectedLocation={selectedLocation}
                    onSetupComplete={({ rankingInputsReady, rankingLifecycle }) => {
                      setDraftSaved(true);
                      setMyPreferencesSaved(true);
                      setRankingStatus(
                        rankingLifecycle.state === "waiting"
                          ? "Setup complete. Waiting for your partner to finish."
                          : "Setup complete! Generating shared suggestions..."
                      );
                    }}
                  />
                ) : null}

                {mapStage === "spots" && !confirmedPlace && (
                  <SpotsListOverlay
                    results={rankedResults}
                    shortlistVenueIds={shortlist.map((item) => item.venueId)}
                    confirmedVenueId={confirmedVenueId}
                    reactions={reactions}
                    participantId={participantId ?? undefined}
                    reactionPendingVenueIds={reactionPendingVenueIds}
                    reactionStatusByVenueId={reactionStatusByVenueId}
                    selectedVenueId={selectedVenueId}
                    focusedVenueId={focusedVenueId}
                    onAddToShortlist={addToShortlist}
                    onReact={reactToVenue}
                    onVenueFocus={(venueId) => setFocusedVenueId(venueId)}
                    rankingStatus={rankingStatus}
                    onRefresh={refreshRanking}
                    refreshDisabled={!Boolean(sync.snapshot?.rankingInputsReady) || rankingRefreshPending}
                    showRefresh={true}
                  />
                )}

                {(shortlist.length > 0 || mapStage === "shortlist") && !confirmedPlace && (
                  <ShortlistOverlay
                    shortlist={shortlist}
                    confirmedPlace={confirmedPlace}
                    onConfirm={confirmShortlistedVenue}
                    decisionStatus={decisionStatus}
                  />
                )}

                {confirmedPlace && (
                  <ConfirmOverlay confirmedPlace={confirmedPlace} />
                )}
              </aside>
            </div>
          </>
        )}

        {state === "join_error" && (
          <p className="status-badge status-error">Error: unable to join this session. Please request a new link.</p>
        )}
      </div>
    </main>
  );
}
