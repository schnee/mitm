"use client";

import type { SessionSnapshotParticipant } from "../../lib/api/session-client";

export function ParticipantStatus({ participants }: { participants: SessionSnapshotParticipant[] }) {
  const sorted = participants.slice().sort((a, b) => a.role.localeCompare(b.role));

  return (
    <section className="panel stage" aria-labelledby="participant-status-title">
      <header className="section-header">
        <h2 id="participant-status-title">Participant status</h2>
        <p>Readiness updates sync live as both people complete each step.</p>
      </header>
      <ul className="card-list">
        {sorted.map((participant) => (
          <li key={participant.participantId} className="result-card">
            <p>
              <strong>{participant.role}</strong>: joined
            </p>
            <p className={`status-badge ${participant.locationConfirmedAt ? "status-success" : "status-waiting"}`}>
              {participant.locationConfirmedAt ? "Success: location confirmed" : "Waiting: location pending"}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
