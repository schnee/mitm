"use client";

import { useEffect, useState } from "react";
import { confirmLocation } from "../../lib/api/session-client";

export function LocationConfirmCard({
  sessionId,
  participantId,
  draftSaved,
  inputsReady,
  onConfirmed
}: {
  sessionId: string;
  participantId: string;
  draftSaved: boolean;
  inputsReady: boolean;
  onConfirmed: (confirmedAt: string) => void;
}) {
  const [statusType, setStatusType] = useState<"idle" | "loading" | "waiting" | "success" | "error">("idle");
  const [status, setStatus] = useState("Idle: confirm your location when your draft is ready.");

  useEffect(() => {
    if (inputsReady) {
      setStatusType("success");
      setStatus("Success: confirmed. Inputs are ready for ranking.");
    }
  }, [inputsReady]);

  const runConfirm = async () => {
    try {
      setStatusType("loading");
      setStatus("Loading: confirming your location.");
      const result = await confirmLocation({ sessionId, participantId });
      if (result.inputsReady) {
        setStatusType("success");
        setStatus("Success: confirmed. Inputs are ready for ranking.");
      } else {
        setStatusType("waiting");
        setStatus("Waiting: your location is confirmed. Waiting for the other participant.");
      }
      onConfirmed(result.confirmedAt);
    } catch {
      setStatusType("error");
      setStatus("Error: unable to confirm location right now. Please retry.");
    }
  };

  const statusClass =
    statusType === "loading"
      ? "status-loading"
      : statusType === "waiting"
        ? "status-waiting"
        : statusType === "success"
          ? "status-success"
          : statusType === "error"
            ? "status-error"
            : "status-idle";

  return (
    <section className="panel stage" aria-labelledby="location-confirm-title">
      <header className="section-header">
        <h2 id="location-confirm-title">Confirm your location</h2>
        <p>Confirm once your draft looks right. This unlocks ranking for both participants.</p>
      </header>
      <button
        className="btn-primary"
        type="button"
        disabled={!draftSaved}
        onClick={() => {
          void runConfirm();
        }}
      >
        Confirm location
      </button>
      {!draftSaved && <p className="status-badge status-waiting">Waiting: save a location draft before confirming.</p>}
      <p className={`status-badge ${statusClass}`} role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
}
