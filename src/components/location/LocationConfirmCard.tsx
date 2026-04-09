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
  const [status, setStatus] = useState("Awaiting confirmation");

  useEffect(() => {
    if (inputsReady) {
      setStatus("Confirmed. Inputs ready for ranking.");
    }
  }, [inputsReady]);

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
