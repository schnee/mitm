"use client";

import { useState } from "react";
import { createSession } from "../lib/api/session-client";

type HostState = "idle" | "creating" | "created" | "error";

interface CreatedSession {
  inviteeJoinUrl: string;
  hostContinueUrl: string;
  sessionId: string;
}

interface HostSessionContext {
  sessionId: string;
  participantId: string;
}

export default function HostPage() {
  const [state, setState] = useState<HostState>("idle");
  const [createdSession, setCreatedSession] = useState<CreatedSession | null>(null);

  const handleCreateSession = async () => {
    setState("creating");
    setCreatedSession(null);

    try {
      const created = await createSession();
      const joinUrl = new URL(created.joinUrl, window.location.origin);
      const token = joinUrl.pathname.split("/s/")[1];
      if (token) {
        const hostSession: HostSessionContext = {
          sessionId: created.sessionId,
          participantId: created.participantId
        };

        localStorage.setItem(
          `host-session:${token}`,
          JSON.stringify(hostSession)
        );
      }

      const hostContinueUrl = new URL(joinUrl.toString());
      hostContinueUrl.searchParams.set("sessionId", created.sessionId);
      hostContinueUrl.searchParams.set("participantId", created.participantId);
      hostContinueUrl.searchParams.set("asHost", "1");

      setCreatedSession({
        sessionId: created.sessionId,
        inviteeJoinUrl: joinUrl.toString(),
        hostContinueUrl: hostContinueUrl.toString()
      });
      setState("created");
    } catch {
      setState("error");
    }
  };

  return (
    <main>
      <h1>Host flow: create a discovery session</h1>
      <button onClick={() => void handleCreateSession()} disabled={state === "creating"}>
        {state === "creating" ? "Creating session..." : "Create session"}
      </button>

      {state === "idle" && <p>Status: idle</p>}
      {state === "creating" && <p>Status: creating</p>}
      {state === "error" && <p>Status: error. Unable to create session.</p>}

      {state === "created" && createdSession && (
        <section>
          <p>Status: created</p>
          <p>Session ID: {createdSession.sessionId}</p>
          <p>Invitee Join URL: {createdSession.inviteeJoinUrl}</p>
          <p>Host Continue URL: {createdSession.hostContinueUrl}</p>
          <button onClick={() => window.open(createdSession.hostContinueUrl, "_blank", "noopener,noreferrer")}>
            Open host continue URL in new tab
          </button>
        </section>
      )}
    </main>
  );
}
