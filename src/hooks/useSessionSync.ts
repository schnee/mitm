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
  if (event.eventType === "session_updated" && typeof event.diff?.status === "string") {
    return {
      ...snapshot,
      status: event.diff.status as SessionSnapshotResponse["status"],
      updatedAt: event.updatedAt
    };
  }

  if (event.eventType === "participant_location_confirmed" && event.participantId) {
    return {
      ...snapshot,
      updatedAt: event.updatedAt,
      participants: snapshot.participants.map((item) =>
        item.participantId === event.participantId
          ? {
              ...item,
              locationConfirmedAt:
                typeof event.diff?.locationConfirmedAt === "string"
                  ? (event.diff.locationConfirmedAt as string)
                  : event.updatedAt
            }
          : item
      )
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

    const hydrate = async () => {
      const next = await getSessionSnapshot(stableSessionId);
      if (!cancelled) {
        setSnapshot(next);
      }
      return next;
    };

    const subscribe = async (latestUpdatedAt?: string) => {
      if (cancelled) {
        return;
      }

      const sinceQuery = latestUpdatedAt ? `?since=${encodeURIComponent(latestUpdatedAt)}` : "";
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
        const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 10_000);

        window.setTimeout(async () => {
          if (cancelled) {
            return;
          }
          try {
            const refreshed = await hydrate();
            await subscribe(refreshed.updatedAt);
          } catch {
            setError("Reconnect failed");
          }
        }, delay);
      };

      try {
        const backlogEvents = await getSessionEvents(stableSessionId, latestUpdatedAt);
        setSnapshot((current) => {
          if (!current) {
            return current;
          }
          return backlogEvents.reduce(mergeEvent, current);
        });
      } catch {
        setError("Unable to fetch session events");
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
    };
  }, [stableSessionId]);

  return {
    syncState,
    snapshot,
    error
  };
}
