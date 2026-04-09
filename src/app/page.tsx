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
  const [linkStatus, setLinkStatus] = useState("Ready to create a session.");

  const statusClassByState: Record<HostState, string> = {
    idle: "status-idle",
    creating: "status-loading",
    created: "status-success",
    error: "status-error"
  };

  const statusCopyByState: Record<HostState, string> = {
    idle: "Idle: start a session when you are ready.",
    creating: "Loading: creating your shared session now.",
    created: "Success: session is ready to share.",
    error: "Error: unable to create session. Please retry."
  };

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
      setLinkStatus("Copy the invite link or continue as host.");
      setState("created");
    } catch {
      setLinkStatus("Retry session creation in a moment.");
      setState("error");
    }
  };

  const copyInviteLink = async () => {
    if (!createdSession) {
      return;
    }

    try {
      await navigator.clipboard.writeText(createdSession.inviteeJoinUrl);
      setLinkStatus("Success: invite link copied.");
    } catch {
      setLinkStatus("Error: could not copy. Please copy manually.");
    }
  };

  return (
    <main>
      <div className="app-shell page-stack">
        <section className="panel startup-hero" aria-labelledby="startup-title">
          <header className="section-header">
            <h1 id="startup-title">Meet Me In The Middle</h1>
            <p>
              Start a shared meetup session in one step. Get a private invite link and continue to ranking and final
              decision.
            </p>
          </header>

          <div className="btn-row">
            <button
              className="btn-primary"
              type="button"
              onClick={() => {
                void handleCreateSession();
              }}
              disabled={state === "creating"}
              aria-label="Create session"
            >
              {state === "creating" ? "Creating session..." : "Create session"}
            </button>
          </div>

          <p className={`status-badge ${statusClassByState[state]}`} aria-live="polite">
            {statusCopyByState[state]}
          </p>
        </section>

        {state === "created" && createdSession && (
          <section className="panel startup-links" aria-labelledby="session-ready-title">
            <header className="section-header">
              <h2 id="session-ready-title">Session ready</h2>
              <p>Share the join URL, then continue as host.</p>
            </header>
            <p>
              <strong>Session ID:</strong> <code>{createdSession.sessionId}</code>
            </p>
            <p>
              <strong>Invitee Join URL:</strong>{" "}
              <a href={createdSession.inviteeJoinUrl} target="_blank" rel="noreferrer">
                {createdSession.inviteeJoinUrl}
              </a>
            </p>
            <p>
              <strong>Host Continue URL:</strong>{" "}
              <a href={createdSession.hostContinueUrl} target="_blank" rel="noreferrer">
                {createdSession.hostContinueUrl}
              </a>
            </p>
            <div className="btn-row">
              <button
                className="btn-secondary"
                type="button"
                onClick={() => {
                  void copyInviteLink();
                }}
              >
                Copy invite link
              </button>
              <button
                className="btn-primary"
                type="button"
                onClick={() => window.open(createdSession.hostContinueUrl, "_blank", "noopener,noreferrer")}
              >
                Continue as host
              </button>
            </div>
            <p className="muted" aria-live="polite">
              {linkStatus}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
