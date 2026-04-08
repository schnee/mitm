"use client";

import { useState } from "react";
import {
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
  onSaved: () => void;
}) {
  const [split, setSplit] = useState<WillingnessSplit>("50_50");
  const [tags, setTags] = useState<PreferenceTag[]>(["coffee"]);
  const [status, setStatus] = useState("Set your split and preferences.");

  const toggleTag = (tag: PreferenceTag) => {
    setTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag].slice(0, 5)
    );
  };

  const submit = async () => {
    try {
      await upsertRankingInputs({ sessionId, participantId, split, tags });
      setStatus("Ranking inputs saved.");
      onSaved();
    } catch {
      setStatus("Unable to save ranking inputs. Check your selection and retry.");
    }
  };

  return (
    <section>
      <h2>Ranking inputs</h2>
      <fieldset>
        <legend>Travel split</legend>
        <label>
          <input
            type="radio"
            name="split"
            value="50_50"
            checked={split === "50_50"}
            onChange={() => setSplit("50_50")}
          />
          50/50
        </label>
        <label>
          <input
            type="radio"
            name="split"
            value="60_40"
            checked={split === "60_40"}
            onChange={() => setSplit("60_40")}
          />
          60/40
        </label>
        <label>
          <input
            type="radio"
            name="split"
            value="70_30"
            checked={split === "70_30"}
            onChange={() => setSplit("70_30")}
          />
          70/30
        </label>
      </fieldset>

      <fieldset>
        <legend>Preference tags</legend>
        {TAG_LABELS.map((tag) => (
          <label key={tag.value}>
            <input
              type="checkbox"
              checked={tags.includes(tag.value)}
              onChange={() => toggleTag(tag.value)}
            />
            {tag.label}
          </label>
        ))}
      </fieldset>

      <button
        type="button"
        onClick={() => {
          void submit();
        }}
      >
        Save ranking inputs
      </button>
      <p>{status}</p>
    </section>
  );
}
