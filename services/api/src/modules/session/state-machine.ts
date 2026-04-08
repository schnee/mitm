export type LifecycleStatus = "created" | "joined" | "locating" | "ranked" | "confirmed" | "expired";

const ALLOWED_TRANSITIONS: Record<LifecycleStatus, LifecycleStatus[]> = {
  created: ["joined", "expired"],
  joined: ["locating", "expired"],
  locating: ["ranked", "expired"],
  ranked: ["confirmed", "expired"],
  confirmed: [],
  expired: []
};

export class SessionTransitionError extends Error {
  readonly from: LifecycleStatus;
  readonly to: LifecycleStatus;

  constructor(from: LifecycleStatus, to: LifecycleStatus) {
    super(`Illegal session transition from '${from}' to '${to}'`);
    this.from = from;
    this.to = to;
  }
}

export function canTransition(from: LifecycleStatus, to: LifecycleStatus): boolean {
  if (from === to) {
    return true;
  }
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertValidTransition(from: LifecycleStatus, to: LifecycleStatus): void {
  if (!canTransition(from, to)) {
    throw new SessionTransitionError(from, to);
  }
}
