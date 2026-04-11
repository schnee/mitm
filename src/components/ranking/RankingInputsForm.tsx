"use client";

import { useState } from "react";
import {
  type RankingLifecycleResponse,
  type PreferenceTag,
  type WillingnessSplit,
  upsertRankingInputs
} from "../../lib/api/session-client";

const TAG_LABELS: Array<{ value: PreferenceTag; label: string }> = [
  { value: "coffee", label: "coffee" },
  { value: "cocktails", label: "cocktails" },
  { value: "vintage_shops", label: "vintage shops" },
  { value: "dessert", label: "dessert" },
  { value: "quiet", label: "quiet" }
];

export function RankingInputsForm({
  sessionId,
  participantId,
  onSaved
}: {
  sessionId: string;
  participantId: string;
  onSaved: (result: { rankingInputsReady: boolean; rankingLifecycle: RankingLifecycleResponse }) => void;
}) {
  const [split, setSplit] = useState<WillingnessSplit>("60_40");
  const [tags, setTags] = useState<PreferenceTag[]>(["coffee"]);
  const [statusType, setStatusType] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [status, setStatus] = useState("Idle: choose your travel split and meet-up tags.");

  const toggleTag = (tag: PreferenceTag) => {
    setTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag].slice(0, 5)
    );
  };

  const submit = async () => {
    try {
      setStatusType("loading");
      setStatus("Loading: saving meet-up preferences.");
      const result = await upsertRankingInputs({ sessionId, participantId, split, tags });
      setStatusType("success");
      setStatus(
        result.rankingLifecycle.state === "waiting"
          ? "Success: preferences saved. Waiting for your partner to finish."
          : "Success: preferences saved. Generating shared suggestions."
      );
      onSaved({ rankingInputsReady: result.rankingInputsReady, rankingLifecycle: result.rankingLifecycle });
    } catch {
      setStatusType("error");
      setStatus("Error: unable to save meet-up preferences. Check your selection and retry.");
    }
  };

  const statusClass = statusType === "loading" ? "status-loading" : statusType === "success" ? "status-success" : statusType === "error" ? "status-error" : "status-idle";

  return (
    <section className="panel stage" aria-labelledby="ranking-inputs-title">
      <header className="section-header">
        <h2 id="ranking-inputs-title">Meet-up preferences</h2>
        <p>Set your travel willingness and tags to generate shared suggestions.</p>
      </header>

      <fieldset className="panel input-stack">
        <legend>Travel split</legend>
        <label htmlFor="split-50-50">
          <input
            id="split-50-50"
            type="radio"
            name="split"
            value="50_50"
            checked={split === "50_50"}
            onChange={() => setSplit("50_50")}
          />
          50/50
        </label>
        <label htmlFor="split-60-40">
          <input
            id="split-60-40"
            type="radio"
            name="split"
            value="60_40"
            checked={split === "60_40"}
            onChange={() => setSplit("60_40")}
          />
          60/40
        </label>
        <label htmlFor="split-70-30">
          <input
            id="split-70-30"
            type="radio"
            name="split"
            value="70_30"
            checked={split === "70_30"}
            onChange={() => setSplit("70_30")}
          />
          70/30
        </label>
      </fieldset>

      <fieldset className="panel input-stack">
        <legend>Preference tags</legend>
        <div className="chip-list">
          {TAG_LABELS.map((tag) => (
            <label key={tag.value} className="chip" htmlFor={`tag-${tag.value}`}>
              <input
                id={`tag-${tag.value}`}
                type="checkbox"
                checked={tags.includes(tag.value)}
                onChange={() => toggleTag(tag.value)}
              />
              {tag.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="btn-row">
        <button
          className="btn-primary"
          type="button"
          onClick={() => {
            void submit();
          }}
        >
          Save meet-up preferences
        </button>
      </div>
      <p className={`status-badge ${statusClass}`} role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
}
