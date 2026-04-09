import { SessionDomainError, type SessionRepository } from "../../modules/session/repository";

const REQUIRED_FUNNEL_EVENTS = [
  "session_start",
  "inputs_set",
  "results_returned",
  "decision_confirmed"
] as const;

type RequiredFunnelEvent = (typeof REQUIRED_FUNNEL_EVENTS)[number];

function toEpoch(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const epoch = Date.parse(value);
  return Number.isNaN(epoch) ? null : epoch;
}

export async function getSessionFunnelHandler(
  sessionId: string,
  deps: { repository: SessionRepository }
): Promise<{ status: number; body: unknown }> {
  try {
    const events = deps.repository.listFunnelEvents(sessionId);
    const completeness = REQUIRED_FUNNEL_EVENTS.reduce(
      (acc, event) => {
        acc[event] = events.some((item) => item.event === event);
        return acc;
      },
      {} as Record<RequiredFunnelEvent, boolean>
    );
    const reactionEvents = events.filter((item) => item.event === "result_reacted");
    const shortlistEvents = events.filter((item) => item.event === "shortlist_opened");
    const firstReactionAt = reactionEvents[0]?.occurredAt ?? null;
    const firstShortlistAt = shortlistEvents[0]?.occurredAt ?? null;
    const firstReactionEpoch = toEpoch(firstReactionAt ?? undefined);
    const firstShortlistEpoch = toEpoch(firstShortlistAt ?? undefined);
    const reactionToShortlistSeconds =
      firstReactionEpoch !== null && firstShortlistEpoch !== null
        ? Math.max(0, Math.round((firstShortlistEpoch - firstReactionEpoch) / 1000))
        : null;
    const acceptCount = reactionEvents.filter((item) => item.metadata?.reaction === "accept").length;
    const passCount = reactionEvents.filter((item) => item.metadata?.reaction === "pass").length;

    return {
      status: 200,
      body: {
        sessionId,
        events,
        completeness,
        interactionSummary: {
          reactionCount: reactionEvents.length,
          acceptCount,
          passCount,
          firstReactionAt,
          firstShortlistAt,
          reactionToShortlistSeconds
        }
      }
    };
  } catch (error) {
    if (error instanceof SessionDomainError && error.code === "SESSION_NOT_FOUND") {
      return { status: 404, body: { error: "SESSION_NOT_FOUND" } };
    }

    return { status: 500, body: { error: "UNEXPECTED_ERROR" } };
  }
}
