"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

interface CreateContributionFormProps {
  questUri: string;
}

export function CreateContributionForm({ questUri }: CreateContributionFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData();
    form.set("questUri", questUri);
    form.set("message", message);
    form.set("body", body);

    const files = fileInputRef.current?.files;
    if (files) {
      for (const file of Array.from(files)) {
        form.append("files", file);
      }
    }

    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        body: form,
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create contribution");
      }

      setMessage("");
      setBody("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create contribution",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-lg border border-stone-200 bg-stone-50 p-3">
      <h4 className="text-sm font-semibold text-stone-700">Log Contribution</h4>
      <input
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={300}
        placeholder="Short message"
        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        disabled={loading}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={3000}
        rows={4}
        placeholder="Details, notes, evidence"
        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        disabled={loading}
      />
      <input
        ref={fileInputRef}
        type="file"
        name="files"
        multiple
        accept="image/png,image/jpeg,image/webp,application/pdf"
        className="block w-full text-sm"
        disabled={loading}
      />
      {error && <p className="text-sm text-rose-700">{error}</p>}
      <button
        type="submit"
        disabled={loading || message.trim().length === 0}
        className="rounded-md bg-stone-900 px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {loading ? "Saving..." : "Add Contribution"}
      </button>
    </form>
  );
}
