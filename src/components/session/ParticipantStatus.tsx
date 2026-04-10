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
            <p className="status-inline-partner">
              <strong>{participant.role}</strong>: joined
            </p>
            <p className={`status-badge ${participant.locationConfirmedAt ? "status-success" : "status-waiting"}`}>
              {participant.locationConfirmedAt ? "Success: location confirmed" : "Waiting: location pending"}
            </p>
            <div className="chip-list" aria-label={`${participant.role} phase status`}>
              <span className="chip">joined</span>
              <span className="chip">{participant.locationConfirmedAt ? "location" : "location pending"}</span>
              <span className="chip">preferences</span>
              <span className="chip">results</span>
              <span className="chip">confirmed</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
