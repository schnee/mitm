"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { joinSessionByToken } from "../../../lib/api/session-client";
import { useSessionSync } from "../../../hooks/useSessionSync";
import { ParticipantStatus } from "../../../components/session/ParticipantStatus";
import { LocationCaptureForm } from "../../../components/location/LocationCaptureForm";
import { LocationConfirmCard } from "../../../components/location/LocationConfirmCard";

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
        </>
      )}
      {state === "join_error" && <p>Unable to join this session. Please request a new link.</p>}
    </main>
  );
}
