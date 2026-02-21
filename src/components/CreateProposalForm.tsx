"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface CreateProposalFormProps {
  questUri: string;
}

export function CreateProposalForm({ questUri }: CreateProposalFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [bskyThreadUri, setBskyThreadUri] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          questUri,
          title,
          body,
          bskyThreadUri,
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create proposal");
      }

      setTitle("");
      setBody("");
      setBskyThreadUri("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create proposal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-lg border border-stone-200 bg-stone-50 p-3">
      <h4 className="text-sm font-semibold text-stone-700">Open Proposal</h4>
      <input
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={100}
        placeholder="Proposal title"
        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        disabled={loading}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={3000}
        rows={4}
        placeholder="Details"
        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        disabled={loading}
      />
      <input
        value={bskyThreadUri}
        onChange={(e) => setBskyThreadUri(e.target.value)}
        placeholder="Optional Bsky at:// thread URI"
        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        disabled={loading}
      />
      {error && <p className="text-sm text-rose-700">{error}</p>}
      <button
        type="submit"
        disabled={loading || title.trim().length === 0}
        className="rounded-md bg-stone-900 px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {loading ? "Posting..." : "Create Proposal"}
      </button>
    </form>
  );
}
