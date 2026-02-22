import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeForm } from "@/components/BadgeForm";
import { CreateContributionForm } from "@/components/CreateContributionForm";
import { CreateProposalForm } from "@/components/CreateProposalForm";
import { LoginForm } from "@/components/LoginForm";
import { LogoutButton } from "@/components/LogoutButton";
import { ProposalStateToggle } from "@/components/ProposalStateToggle";
import { getSession } from "@/lib/auth/session";
import {
  getQuestByDidRkey,
  listBadgesBySubjects,
  listContributionsByQuest,
  listProposalsByQuest,
} from "@/lib/db/queries";
import { timeAgo } from "@/lib/time";

type QuestPageProps = {
  params: Promise<{ rkey: string }>;
  searchParams: Promise<{ tab?: string }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default async function QuestPage({ params, searchParams }: QuestPageProps) {
  const session = await getSession();
  if (!session) {
    return (
      <main className="mx-auto mt-20 w-full max-w-md rounded-xl border border-stone-200 bg-white p-6">
        <p className="mb-4 text-sm text-stone-600">Sign in to open your quests.</p>
        <LoginForm />
      </main>
    );
  }

  const { rkey } = await params;
  const { tab = "readme" } = await searchParams;

  const quest = await getQuestByDidRkey(session.did, rkey);
  if (!quest) {
    notFound();
  }

  const [proposals, contributions] = await Promise.all([
    listProposalsByQuest(quest.uri),
    listContributionsByQuest(quest.uri),
  ]);
  const badgesByContribution = await listBadgesBySubjects(
    contributions.map((item) => item.uri),
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm text-stone-600 underline">
          ← Back to home
        </Link>
        <LogoutButton />
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-6 px-6 pb-10">
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h1 className="text-2xl font-semibold">{quest.name}</h1>
          <p className="mt-1 text-sm text-stone-600">
            Proposals: {proposals.length} | Contributions: {contributions.length}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <Link
              href={`/quests/${quest.rkey}?tab=readme`}
              className={`rounded-md px-3 py-1 ${
                tab === "readme" ? "bg-stone-900 text-white" : "bg-stone-100"
              }`}
            >
              Readme
            </Link>
            <Link
              href={`/quests/${quest.rkey}?tab=proposals`}
              className={`rounded-md px-3 py-1 ${
                tab === "proposals" ? "bg-stone-900 text-white" : "bg-stone-100"
              }`}
            >
              Proposals ({proposals.length})
            </Link>
            <Link
              href={`/quests/${quest.rkey}?tab=contributions`}
              className={`rounded-md px-3 py-1 ${
                tab === "contributions" ? "bg-stone-900 text-white" : "bg-stone-100"
              }`}
            >
              Contributions ({contributions.length})
            </Link>
          </div>
        </section>

        {tab === "readme" && (
          <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-5 text-sm leading-7">
            <h2 className="text-base font-semibold">Purpose</h2>
            <p>{quest.description ?? "No description yet."}</p>

            <h3 className="text-base font-semibold">Topics</h3>
            {quest.topics.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {quest.topics.map((topic) => (
                  <span key={topic} className="rounded-md bg-stone-100 px-2 py-1 text-xs">
                    {topic}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-stone-500">No topics.</p>
            )}

            <h3 className="text-base font-semibold">References</h3>
            <ul className="list-disc pl-5 text-stone-600">
              <li>Library catalog (add links in the quest description)</li>
              <li>Target article list (add links in the quest description)</li>
            </ul>
          </section>
        )}

        {tab === "proposals" && (
          <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-5">
            <CreateProposalForm questUri={quest.uri} />
            <ul className="space-y-3">
              {proposals.map((proposal) => (
                <li key={proposal.uri} className="rounded-lg border border-stone-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/proposals?uri=${encodeURIComponent(proposal.uri)}`}
                        className="font-medium underline"
                      >
                        {proposal.title}
                      </Link>
                      <p className="mt-1 text-xs text-stone-500">
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
                      {proposal.did === session.did && (
                        <ProposalStateToggle rkey={proposal.rkey} state={proposal.state} />
                      )}
                    </div>
                  </div>
                  {proposal.body && (
                    <p className="mt-3 text-sm text-stone-700">{proposal.body}</p>
                  )}
                </li>
              ))}
              {proposals.length === 0 && (
                <li className="text-sm text-stone-500">No proposals yet.</li>
              )}
            </ul>
          </section>
        )}

        {tab === "contributions" && (
          <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-5">
            <CreateContributionForm questUri={quest.uri} />
            <div className="space-y-4">
              {contributions.map((contribution) => (
                <article key={contribution.uri} className="rounded-lg border border-stone-200 p-4">
                  <p className="text-sm font-medium">{contribution.message}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    @{contribution.handle ?? contribution.did} · {timeAgo(contribution.createdAt)}
                  </p>
                  {contribution.body && (
                    <p className="mt-3 text-sm text-stone-700 whitespace-pre-wrap">
                      {contribution.body}
                    </p>
                  )}

                  {contribution.media.length > 0 && (
                    <ul className="mt-3 space-y-1 text-xs text-stone-600">
                      {contribution.media.map((item, index) => {
                        if (!isRecord(item)) {
                          return <li key={index}>Attachment #{index + 1}</li>;
                        }

                        const originalName =
                          typeof item.originalName === "string"
                            ? item.originalName
                            : `attachment-${index + 1}`;
                        const mimeType =
                          typeof item.mimeType === "string"
                            ? item.mimeType
                            : "unknown";
                        const size =
                          typeof item.size === "number"
                            ? formatFileSize(item.size)
                            : "";

                        return (
                          <li key={index}>
                            📎 {originalName} ({mimeType}) {size}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {(badgesByContribution[contribution.uri] ?? []).length > 0 && (
                    <div className="mt-3 space-y-2 rounded-md bg-stone-50 p-3">
                      {(badgesByContribution[contribution.uri] ?? []).map((badge) => (
                        <div key={badge.uri} className="text-xs text-stone-700">
                          <span className="font-semibold">{badge.badgeType}</span> from @
                          {badge.handle ?? badge.did}
                          <p className="mt-1 text-stone-600">&quot;{badge.comment}&quot;</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <BadgeForm subjectUri={contribution.uri} />
                </article>
              ))}
              {contributions.length === 0 && (
                <p className="text-sm text-stone-500">No contributions yet.</p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
