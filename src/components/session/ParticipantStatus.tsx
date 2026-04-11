"use client";

import type { SessionSnapshotParticipant } from "../../lib/api/session-client";

export function ParticipantStatus({ participants }: { participants: SessionSnapshotParticipant[] }) {
  const sorted = participants.slice().sort((a, b) => a.role.localeCompare(b.role));

  return (
    <section className="panel stage" aria-labelledby="participant-status-title">
      <header className="section-header">
        <h2 id="participant-status-title">Participant status</h2>
      </header>
      <table className="progress-table">
        <thead>
          <tr>
            <th scope="col"></th>
            <th scope="col">Joined</th>
            <th scope="col">Location</th>
            <th scope="col">Prefs</th>
            <th scope="col">Results</th>
            <th scope="col">Confirmed</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((participant) => (
            <tr key={participant.participantId}>
              <th scope="row">{participant.role}</th>
              <td className="check">✓</td>
              <td className={participant.locationConfirmedAt ? "check" : ""}>{participant.locationConfirmedAt ? "✓" : "○"}</td>
              <td className={participant.rankingInputsUpdatedAt ? "check" : ""}>{participant.rankingInputsUpdatedAt ? "✓" : "○"}</td>
              <td>—</td>
              <td>—</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
