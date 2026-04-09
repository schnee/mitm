"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getSessionEvents,
  getSessionSnapshot,
  type SessionEventResponse,
  type SessionSnapshotResponse
} from "../lib/api/session-client";

export type SyncState = "syncing" | "live" | "reconnecting";

function mergeEvent(snapshot: SessionSnapshotResponse, event: SessionEventResponse): SessionSnapshotResponse {
  if (event.eventType === "session_updated") {
    const nextStatus =
      typeof event.diff?.status === "string" ? (event.diff.status as SessionSnapshotResponse["status"]) : snapshot.status;
    const nextShortlist = Array.isArray(event.diff?.shortlist)
      ? (event.diff.shortlist as SessionSnapshotResponse["shortlist"])
      : snapshot.shortlist;
    const hasConfirmedPlace = Object.prototype.hasOwnProperty.call(event.diff ?? {}, "confirmedPlace");
    const nextConfirmedPlace = hasConfirmedPlace
      ? (event.diff?.confirmedPlace as SessionSnapshotResponse["confirmedPlace"])
      : snapshot.confirmedPlace;
    const nextInputsReady =
      typeof event.diff?.inputsReady === "boolean"
        ? (event.diff.inputsReady as boolean)
        : snapshot.inputsReady;

    return {
      ...snapshot,
      status: nextStatus,
      shortlist: nextShortlist,
      confirmedPlace: nextConfirmedPlace,
      inputsReady: nextInputsReady,
      updatedAt: event.updatedAt
    };
  }

  if (event.eventType === "participant_location_confirmed" && event.participantId) {
    const nextParticipants = snapshot.participants.map((item) =>
      item.participantId === event.participantId
        ? {
            ...item,
            locationConfirmedAt:
              typeof event.diff?.locationConfirmedAt === "string"
                ? (event.diff.locationConfirmedAt as string)
                : event.updatedAt
          }
        : item
    );

    return {
      ...snapshot,
      updatedAt: event.updatedAt,
      participants: nextParticipants,
      inputsReady: nextParticipants.length === 2 && nextParticipants.every((item) => Boolean(item.locationConfirmedAt))
    };
  }

  return {
    ...snapshot,
    updatedAt: event.updatedAt
  };
}

export function useSessionSync(sessionId: string | null) {
  const [syncState, setSyncState] = useState<SyncState>("syncing");
  const [snapshot, setSnapshot] = useState<SessionSnapshotResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const stableSessionId = useMemo(() => sessionId, [sessionId]);

  useEffect(() => {
    if (!stableSessionId) {
      return;
    }

    let cancelled = false;
    let eventSource: EventSource | null = null;
    let pollIntervalId: number | null = null;
    let reconnectTimeoutId: number | null = null;
    let fallbackEstablished = false;
    let consecutivePollErrors = 0;
    let latestUpdatedAt: string | undefined;

    const hydrate = async () => {
      const next = await getSessionSnapshot(stableSessionId);
      if (!cancelled) {
        setSnapshot(next);
      }
      latestUpdatedAt = next.updatedAt;
      return next;
    };

    const applyEvents = (events: SessionEventResponse[]) => {
      if (events.length === 0) {
        return;
      }
      latestUpdatedAt = events[events.length - 1]?.updatedAt;
      setSnapshot((current) => {
        if (!current) {
          return current;
        }
        return events.reduce(mergeEvent, current);
      });
    };

    const startFallbackPolling = () => {
      if (cancelled || pollIntervalId !== null) {
        return;
      }

      setSyncState("reconnecting");

      const pollOnce = async () => {
        if (cancelled) {
          return;
        }

        try {
          const events = await getSessionEvents(stableSessionId, latestUpdatedAt);
          applyEvents(events);
          consecutivePollErrors = 0;
          if (!fallbackEstablished) {
            fallbackEstablished = true;
            setSyncState("live");
          }
        } catch {
          consecutivePollErrors += 1;
          setSyncState("reconnecting");

          if (consecutivePollErrors >= 3) {
            try {
              await hydrate();
              consecutivePollErrors = 0;
              fallbackEstablished = true;
              setSyncState("live");
            } catch {
              setError("Fallback sync failed");
            }
          }
        }
      };

      void pollOnce();
      pollIntervalId = window.setInterval(() => {
        void pollOnce();
      }, 1000);
    };

    const subscribe = async (cursor?: string) => {
      if (cancelled) {
        return;
      }

      if (typeof window.EventSource !== "function") {
        startFallbackPolling();
        return;
      }

      const sinceQuery = cursor ? `?since=${encodeURIComponent(cursor)}` : "";
      eventSource = new EventSource(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"}/v1/sessions/${stableSessionId}/events${sinceQuery}`
      );

      eventSource.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setSyncState("live");
      };

      eventSource.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data) as SessionEventResponse;
          latestUpdatedAt = event.updatedAt;
          setSnapshot((current) => (current ? mergeEvent(current, event) : current));
        } catch {
          setError("Invalid event payload");
        }
      };

      eventSource.onerror = async () => {
        if (cancelled) {
          return;
        }

        setSyncState("reconnecting");
        eventSource?.close();
        reconnectAttemptsRef.current += 1;

        if (reconnectAttemptsRef.current >= 3) {
          startFallbackPolling();
          return;
        }

        const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 10_000);

        reconnectTimeoutId = window.setTimeout(async () => {
          if (cancelled) {
            return;
          }
          try {
            const refreshed = await hydrate();
            await subscribe(refreshed.updatedAt);
          } catch {
            setError("Reconnect failed");
            startFallbackPolling();
          }
        }, delay);
      };

      try {
        const backlogEvents = await getSessionEvents(stableSessionId, cursor);
        applyEvents(backlogEvents);
      } catch {
        startFallbackPolling();
      }
    };

    (async () => {
      try {
        setSyncState("syncing");
        const initial = await hydrate();
        await subscribe(initial.updatedAt);
      } catch {
        setError("Unable to hydrate session state");
      }
    })();

    return () => {
      cancelled = true;
      eventSource?.close();
      if (pollIntervalId !== null) {
        window.clearInterval(pollIntervalId);
      }
      if (reconnectTimeoutId !== null) {
        window.clearTimeout(reconnectTimeoutId);
      }
    };
  }, [stableSessionId]);

  return {
    syncState,
    snapshot,
    error
  };
}
