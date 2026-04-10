"use client";

export function NextActionRail({
  label,
  onClick,
  disabled,
  status
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  status: "idle" | "loading" | "waiting" | "success" | "error";
}) {
  const statusClass =
    status === "loading"
      ? "status-loading"
      : status === "waiting"
        ? "status-waiting"
        : status === "success"
          ? "status-success"
          : status === "error"
            ? "status-error"
            : "status-idle";

  return (
    <section className="next-action-rail" aria-label="Next action rail">
      <button className="btn-primary next-action-button" type="button" onClick={onClick} disabled={disabled}>
        {label}
      </button>
      <p className={`status-badge ${statusClass}`} role="status" aria-live="polite">
        Next action
      </p>
    </section>
  );
}
