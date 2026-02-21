"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface BadgeFormProps {
  subjectUri: string;
}

const BADGE_OPTIONS = [
  { value: "continuous", label: "continuous" },
  { value: "insightful", label: "insightful" },
  { value: "collaborator", label: "collaborator" },
  { value: "brave", label: "brave" },
] as const;

export function BadgeForm({ subjectUri }: BadgeFormProps) {
  const router = useRouter();
  const [badgeType, setBadgeType] = useState<(typeof BADGE_OPTIONS)[number]["value"]>(
    "insightful",
  );
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/badges", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subjectUri,
          badgeType,
          comment,
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to send badge");
      }

      setComment("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send badge");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2 rounded-md border border-stone-200 bg-white p-3">
      <p className="text-xs font-semibold text-stone-600">Send Badge</p>
      <select
        value={badgeType}
        onChange={(e) => setBadgeType(e.target.value as typeof badgeType)}
        className="w-full rounded-md border border-stone-300 px-2 py-1 text-sm"
        disabled={loading}
      >
        {BADGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <textarea
        required
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={300}
        rows={2}
        placeholder="Reason (required)"
        className="w-full rounded-md border border-stone-300 px-2 py-1 text-sm"
        disabled={loading}
      />
      {error && <p className="text-xs text-rose-700">{error}</p>}
      <button
        type="submit"
        disabled={loading || comment.trim().length === 0}
        className="rounded-md bg-stone-800 px-2 py-1 text-xs text-white disabled:opacity-50"
      >
        {loading ? "Sending..." : "Give Badge"}
      </button>
    </form>
  );
}
