"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateQuestForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [topics, setTopics] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/quests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          topics: topics
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });

      const data = (await res.json()) as { error?: string; rkey?: string };
      if (!res.ok || !data.rkey) {
        throw new Error(data.error ?? "Failed to create quest");
      }

      setName("");
      setDescription("");
      setTopics("");

      router.push(`/quests/${data.rkey}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create quest");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-stone-700">New Quest</h3>
      <div className="space-y-2">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder="Quest name"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          disabled={loading}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="What is this quest about?"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          disabled={loading}
        />
        <input
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
          placeholder="topics, separated, by commas"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          disabled={loading}
        />
      </div>
      {error && <p className="text-sm text-rose-700">{error}</p>}
      <button
        type="submit"
        disabled={loading || name.trim().length === 0}
        className="rounded-md bg-stone-900 px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Quest"}
      </button>
    </form>
  );
}
