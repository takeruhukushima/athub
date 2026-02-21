"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface ProposalStateToggleProps {
  rkey: string;
  state: "open" | "closed";
}

export function ProposalStateToggle({ rkey, state }: ProposalStateToggleProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const nextState = state === "open" ? "closed" : "open";

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/proposals/${rkey}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ state: nextState }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to change proposal state");
      }

      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-md border border-stone-300 px-2 py-1 text-xs text-stone-700 disabled:opacity-50"
    >
      {loading ? "Updating..." : state === "open" ? "Close" : "Reopen"}
    </button>
  );
}
