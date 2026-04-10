"use client";

import type { SessionFlowStep, SessionStepId } from "../../lib/session-flow";

export function SessionProgressBar({
  steps,
  activeStepId,
  meRole,
  partnerRole
}: {
  steps: SessionFlowStep[];
  activeStepId: SessionStepId;
  meRole: "host" | "invitee";
  partnerRole: "host" | "invitee" | null;
}) {
  const activeStep = steps.find((step) => step.id === activeStepId);
  const blockerText =
    activeStep?.blockedBy === "partner"
      ? "Waiting for partner..."
      : activeStep?.blockedBy === "self"
        ? "Your turn..."
        : "On track";

  return (
    <section className="panel session-progress-sticky stage" aria-label="Session progress">
      <div className="status-inline-partner">
        <strong>You</strong>
        <span className="muted">{meRole}</span>
      </div>
      <div className="status-inline-partner">
        <strong>Partner</strong>
        <span className="muted">{partnerRole ?? "waiting to join"}</span>
      </div>
      <p className={`status-badge ${activeStep?.blockedBy === "partner" ? "status-waiting" : "status-success"}`}>{blockerText}</p>
      <ol className="chip-list" aria-label="Step completion">
        {steps.map((step) => (
          <li key={step.id} className={`chip ${step.completed ? "status-success" : step.id === activeStepId ? "status-loading" : ""}`}>
            {step.title}
          </li>
        ))}
      </ol>
    </section>
  );
}
