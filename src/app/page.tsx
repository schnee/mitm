"use client";

import { useState } from "react";
import { createSession } from "../lib/api/session-client";

const BANNER_DESKTOP = "/images/mmitm-desktop.webp";
const BANNER_MOBILE = "/images/mmitm-mobile.webp";

type HostState = "idle" | "creating" | "created" | "error";

interface CreatedSession {
  inviteeJoinUrl: string;
  hostContinueUrl: string;
}

interface HostSessionContext {
  sessionId: string;
  participantId: string;
}

export default function HostPage() {
  const [state, setState] = useState<HostState>("idle");
  const [createdSession, setCreatedSession] = useState<CreatedSession | null>(null);
  const [includeBriefInstructions, setIncludeBriefInstructions] = useState(true);
  const [linkStatus, setLinkStatus] = useState("Copy the invite link, then paste and send it to your invitee.");

  const statusClassByState: Record<HostState, string> = {
    idle: "status-idle",
    creating: "status-loading",
    created: "status-success",
    error: "status-error"
  };

  const statusCopyByState: Record<HostState, string> = {
    idle: "Find a middle to meet up.",
    creating: "Loading: creating your shared session now.",
    created: "",
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
        inviteeJoinUrl: joinUrl.toString(),
        hostContinueUrl: hostContinueUrl.toString()
      });
      setLinkStatus("Copy the invite link, then paste and send it to your invitee.");
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

    const inviteCopy = includeBriefInstructions
      ? [
          "You're invited to Meet Me in the Middle so we can quickly choose a fair place to meet.",
          "1) Open this link.",
          "2) Set your location and meet-up preferences.",
          "3) Review the ranked spots together.",
          "",
          createdSession.inviteeJoinUrl
        ].join("\n")
      : createdSession.inviteeJoinUrl;

    try {
      await navigator.clipboard.writeText(inviteCopy);
      setLinkStatus(
        includeBriefInstructions
          ? "Copied message and invite link. Paste it and send it to your invitee."
          : "Copied invite link only. Paste it and send it to your invitee."
      );
    } catch {
      setLinkStatus("Could not copy automatically. Tap Copy invite link again to retry.");
    }
  };

  return (
    <main>
      <div className="app-shell page-stack">
        <section className="panel startup-hero" aria-labelledby="startup-title">
          <img
            src={BANNER_DESKTOP}
            srcSet={`${BANNER_MOBILE} 375w, ${BANNER_DESKTOP} 1440w`}
            sizes="(max-width: 768px) 100vw, 1440px"
            alt="Meet Me In The Middle banner"
            className="banner-hero"
          />
          <header className="section-header">
            <h1 id="startup-title">Meet Me In The Middle</h1>
            <p>
              Start a shared meetup session in one step. Get a private invite link and continue to your shared
              suggestions and final decision.
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
              aria-label="Find a middle"
            >
              {state === "creating" ? "Finding a middle..." : "Find a middle"}
            </button>
          </div>

          {state !== "created" && (
            <p className={`status-badge ${statusClassByState[state]}`} aria-live="polite">
              {statusCopyByState[state]}
            </p>
          )}
        </section>

        {state === "created" && createdSession && (
          <section className="panel startup-links" aria-labelledby="session-ready-title">
            <header className="section-header">
              <h2 id="session-ready-title">Let's Go!</h2>
              <p>Copy the invite link and send it to the other person, then continue as host.</p>
            </header>
            <label>
              <input
                type="checkbox"
                checked={includeBriefInstructions}
                onChange={(event) => {
                  setIncludeBriefInstructions(event.target.checked);
                  setLinkStatus(
                    event.target.checked
                      ? "Copying will include a brief invite message and the link."
                      : "Copying will include only the invite link."
                  );
                }}
              />{" "}
              Include brief instructions
            </label>
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
                onClick={() => window.location.assign(createdSession.hostContinueUrl)}
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
