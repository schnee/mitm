"use client";

import { useState } from "react";
import { confirmLocation } from "../../lib/api/session-client";

export function LocationConfirmCard({
  sessionId,
  participantId,
  draftSaved,
  onConfirmed
}: {
  sessionId: string;
  participantId: string;
  draftSaved: boolean;
  onConfirmed: (confirmedAt: string) => void;
}) {
  const [status, setStatus] = useState("Awaiting confirmation");

  const runConfirm = async () => {
    const result = await confirmLocation({ sessionId, participantId });
    setStatus(result.inputsReady ? "Confirmed. Inputs ready for ranking." : "Confirmed. Waiting for other participant.");
    onConfirmed(result.confirmedAt);
  };

  return (
    <section>
      <h2>Confirm your location</h2>
      <button
        type="button"
        disabled={!draftSaved}
        onClick={() => {
          void runConfirm();
        }}
      >
        Confirm location
      </button>
      {!draftSaved && <p>Save a location draft before confirming.</p>}
      <p>{status}</p>
    </section>
  );
}
