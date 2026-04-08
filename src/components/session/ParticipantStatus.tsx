"use client";

import type { SessionSnapshotParticipant } from "../../lib/api/session-client";

export function ParticipantStatus({ participants }: { participants: SessionSnapshotParticipant[] }) {
  const sorted = participants.slice().sort((a, b) => a.role.localeCompare(b.role));

  return (
    <section>
      <h2>Participants</h2>
      <ul>
        {sorted.map((participant) => (
          <li key={participant.participantId}>
            <strong>{participant.role}</strong>: joined
            {participant.locationConfirmedAt ? " | location confirmed" : " | location pending"}
          </li>
        ))}
      </ul>
    </section>
  );
}
