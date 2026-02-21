import Link from "next/link";
import { BadgeForm } from "@/components/BadgeForm";
import { ProposalStateToggle } from "@/components/ProposalStateToggle";
import { getSession } from "@/lib/auth/session";
import { fetchBskyThreadSummary } from "@/lib/atproto/bsky";
import {
  getProposalByUri,
  getQuestByUri,
  listBadgesBySubject,
} from "@/lib/db/queries";
import { timeAgo } from "@/lib/time";

interface ProposalPageProps {
  searchParams: Promise<{
    uri?: string;
  }>;
}

export default async function ProposalPage({ searchParams }: ProposalPageProps) {
  const session = await getSession();
  const { uri } = await searchParams;

  if (!uri) {
    return (
      <main className="mx-auto mt-20 w-full max-w-2xl rounded-xl border border-stone-200 bg-white p-6">
        <p className="text-sm text-stone-600">Proposal URI is required.</p>
        <Link href="/" className="mt-3 inline-block text-sm underline">
          Back to home
        </Link>
      </main>
    );
  }

  const proposal = await getProposalByUri(uri);
  if (!proposal) {
    return (
      <main className="mx-auto mt-20 w-full max-w-2xl rounded-xl border border-stone-200 bg-white p-6">
        <p className="text-sm text-stone-600">Proposal not found in local cache.</p>
      </main>
    );
  }

  const [quest, badges, bskySummary] = await Promise.all([
    getQuestByUri(proposal.questUri),
    listBadgesBySubject(proposal.uri),
    proposal.bskyThreadUri
      ? fetchBskyThreadSummary(proposal.bskyThreadUri)
      : Promise.resolve(null),
  ]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <main className="mx-auto w-full max-w-3xl space-y-5 px-6 py-10">
        <Link href={quest ? `/quests/${quest.rkey}?tab=proposals` : "/"} className="text-sm underline">
          ← Back to quest
        </Link>

        <section className="rounded-xl border border-stone-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold">{proposal.title}</h1>
              <p className="mt-1 text-sm text-stone-500">
                @{proposal.handle ?? proposal.did} · {timeAgo(proposal.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-1 text-xs ${
                  proposal.state === "open"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-stone-200 text-stone-700"
                }`}
              >
                {proposal.state}
              </span>
              {session?.did === proposal.did && (
                <ProposalStateToggle rkey={proposal.rkey} state={proposal.state} />
              )}
            </div>
          </div>

          {proposal.body && (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-stone-700">
              {proposal.body}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-base font-semibold">DDS Alternative: Bsky Thread</h2>
          {proposal.bskyThreadUri ? (
            bskySummary ? (
              <div className="mt-3 space-y-2 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm">
                <p className="text-sky-900">
                  @{bskySummary.authorHandle ?? "unknown"}: {bskySummary.text ?? "(no text)"}
                </p>
                <p className="text-xs text-sky-700">
                  replies {bskySummary.replyCount} · reposts {bskySummary.repostCount} · likes {bskySummary.likeCount}
                </p>
                {bskySummary.webUrl && (
                  <a
                    href={bskySummary.webUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs underline"
                  >
                    Open on bsky.app
                  </a>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-stone-500">
                Could not load the linked Bsky thread.
              </p>
            )
          ) : (
            <p className="mt-3 text-sm text-stone-500">No Bsky thread linked.</p>
          )}
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-base font-semibold">Badges</h2>
          <div className="mt-3 space-y-2">
            {badges.map((badge) => (
              <div key={badge.uri} className="rounded-md border border-stone-200 p-3 text-sm">
                <p className="font-medium">{badge.badgeType}</p>
                <p className="mt-1 text-stone-700">&quot;{badge.comment}&quot;</p>
                <p className="mt-1 text-xs text-stone-500">from @{badge.handle ?? badge.did}</p>
              </div>
            ))}
            {badges.length === 0 && (
              <p className="text-sm text-stone-500">No badges yet.</p>
            )}
          </div>

          {session && <BadgeForm subjectUri={proposal.uri} />}
        </section>
      </main>
    </div>
  );
}
