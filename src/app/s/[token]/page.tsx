"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  confirmVenue,
  getRankedResults,
  joinSessionByToken,
  type ConfirmedPlace,
  type RankedVenue,
  type ShortlistVenue,
  upsertShortlistVenue
} from "../../../lib/api/session-client";
import { useSessionSync } from "../../../hooks/useSessionSync";
import { ParticipantStatus } from "../../../components/session/ParticipantStatus";
import { LocationCaptureForm } from "../../../components/location/LocationCaptureForm";
import { LocationConfirmCard } from "../../../components/location/LocationConfirmCard";
import { RankingInputsForm } from "../../../components/ranking/RankingInputsForm";
import { RankedResultsList } from "../../../components/ranking/RankedResultsList";
import { ShortlistPanel } from "../../../components/decision/ShortlistPanel";
import { ConfirmedPlaceCard } from "../../../components/decision/ConfirmedPlaceCard";

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

export default function JoinPage({ params }: JoinPageProps) {
  const [state, setState] = useState<JoinState>("joining");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null);
  const [rankingInputsSaved, setRankingInputsSaved] = useState(false);
  const [rankingStatus, setRankingStatus] = useState("Waiting for ranking input.");
  const [rankedResults, setRankedResults] = useState<RankedVenue[]>([]);
  const [localShortlist, setLocalShortlist] = useState<ShortlistVenue[]>([]);
  const [localConfirmedPlace, setLocalConfirmedPlace] = useState<ConfirmedPlace | null>(null);
  const [decisionStatus, setDecisionStatus] = useState("Add a result to shortlist to begin deciding.");
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

  const runRanking = async () => {
    if (!sessionId) {
      return;
    }

    try {
      const response = await getRankedResults(sessionId);
      setRankedResults(response.results);
      setRankingStatus(`Ranking generated at ${response.generatedAt}`);
    } catch {
      setRankingStatus("Unable to run ranking. Ensure both participants saved ranking inputs.");
    }
  };

  const shortlist =
    (sync.snapshot?.shortlist.length ?? 0) >= localShortlist.length
      ? (sync.snapshot?.shortlist ?? localShortlist)
      : localShortlist;
  const confirmedPlace = sync.snapshot?.confirmedPlace ?? localConfirmedPlace;

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
      setDecisionStatus("Shortlist updated.");
    } catch {
      setDecisionStatus("Unable to update shortlist right now.");
    }
  };

  const confirmShortlistedVenue = async (venueId: string) => {
    if (!sessionId || !participantId) {
      return;
    }

    try {
      const response = await confirmVenue({ sessionId, participantId, venueId });
      setLocalConfirmedPlace(response.confirmedPlace);
      setDecisionStatus("Place confirmed.");
    } catch {
      setDecisionStatus("This session already has a different confirmed place.");
    }
  };

  return (
    <main>
      {state === "joining" && <p>Joining session...</p>}
      {state === "joined" && (
        <>
          <p>Joined. You can continue to location setup.</p>
          <p>Sync state: {sync.syncState}</p>
          {sync.snapshot && <ParticipantStatus participants={sync.snapshot.participants} />}
          {sessionId && participantId && (
            <>
              <LocationCaptureForm
                sessionId={sessionId}
                participantId={participantId}
                onDraftSaved={() => setDraftSaved(true)}
              />
              <LocationConfirmCard
                sessionId={sessionId}
                participantId={participantId}
                draftSaved={draftSaved}
                onConfirmed={(nextConfirmedAt) => setConfirmedAt(nextConfirmedAt)}
              />
            </>
          )}
          {confirmedAt && <p>Location confirmed at {confirmedAt}</p>}
          {sync.snapshot?.inputsReady && <p>Inputs ready for ranking.</p>}
          {sync.snapshot?.inputsReady && sessionId && participantId && (
            <>
              <RankingInputsForm
                sessionId={sessionId}
                participantId={participantId}
                onSaved={() => setRankingInputsSaved(true)}
              />
              <button
                type="button"
                disabled={!rankingInputsSaved}
                onClick={() => {
                  void runRanking();
                }}
              >
                Run ranking
              </button>
              {!rankingInputsSaved && <p>Save ranking inputs before running ranking.</p>}
              <p>{rankingStatus}</p>
              <RankedResultsList
                results={rankedResults}
                onAddToShortlist={(venue) => {
                  void addToShortlist(venue);
                }}
                shortlistVenueIds={shortlist.map((item) => item.venueId)}
              />
              <p>{decisionStatus}</p>
              <ShortlistPanel
                shortlist={shortlist}
                confirmedPlace={confirmedPlace}
                onConfirm={(venueId) => {
                  void confirmShortlistedVenue(venueId);
                }}
              />
              {confirmedPlace && <ConfirmedPlaceCard confirmedPlace={confirmedPlace} />}
            </>
          )}
        </>
      )}
      {state === "join_error" && <p>Unable to join this session. Please request a new link.</p>}
    </main>
  );
}
