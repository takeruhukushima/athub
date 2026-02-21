import Link from "next/link";
import { CreateQuestForm } from "@/components/CreateQuestForm";
import { LoginForm } from "@/components/LoginForm";
import { LogoutButton } from "@/components/LogoutButton";
import { getSession } from "@/lib/auth/session";
import { describeRepo } from "@/lib/atproto/xrpc";
import {
  getAccountHandleByDid,
  getContributionCountLastDays,
  getContributionHeatmap,
  getPinnedQuests,
  getRecentActivity,
  listLatestQuests,
  searchQuests,
  upsertAccount,
} from "@/lib/db/queries";
import { timeAgo } from "@/lib/time";

interface HomeProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

function heatClass(count: number): string {
  if (count === 0) return "bg-stone-200";
  if (count === 1) return "bg-lime-200";
  if (count <= 3) return "bg-lime-400";
  return "bg-lime-600";
}

export default async function Home({ searchParams }: HomeProps) {
  const session = await getSession();
  const { q = "" } = await searchParams;

  let accountHandle: string | null = null;
  if (session) {
    accountHandle = await getAccountHandleByDid(session.did);
    if (!accountHandle) {
      try {
        const repo = await describeRepo(session, session.did);
        if (repo.handle) {
          accountHandle = repo.handle;
          await upsertAccount({
            did: session.did,
            handle: repo.handle,
            active: 1,
            indexedAt: new Date().toISOString(),
          });
        }
      } catch {
        accountHandle = null;
      }
    }
  }

  const [contributionCount, heatmap, pinnedQuests, recentActivity, searched, latest] =
    await Promise.all([
      session ? getContributionCountLastDays(session.did, 30) : Promise.resolve(0),
      session ? getContributionHeatmap(session.did, 30) : Promise.resolve([]),
      session ? getPinnedQuests(session.did, 6) : Promise.resolve([]),
      getRecentActivity(8),
      q.trim().length > 0 ? searchQuests(q.trim()) : Promise.resolve([]),
      listLatestQuests(8),
    ]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5f5f4_0%,#fafaf9_40%,#ffffff_100%)] text-stone-900">
      <header className="mx-auto flex w-full max-w-6xl items-center gap-4 px-6 py-4">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          athub
        </Link>
        <form className="flex-1" action="/" method="GET">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search quests..."
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
          />
        </form>
        <div className="text-sm text-stone-600">🔔 1</div>
        <div className="text-sm">
          {session ? `@${accountHandle ?? session.did}` : "Guest"}
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-6 pb-10 md:grid-cols-[2fr_1fr]">
        <section className="space-y-6">
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold">Overview</h2>
            {session ? (
              <>
                <p className="text-sm text-stone-600">
                  👣 Contributions in the last 30 days: {contributionCount}
                </p>
                <div className="mt-3 grid grid-cols-10 gap-1">
                  {heatmap.map((day) => (
                    <div
                      key={day.date}
                      title={`${day.date}: ${day.count}`}
                      className={`h-4 w-4 rounded-[3px] ${heatClass(day.count)}`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-stone-600">
                Sign in to see your 30-day contribution heatmap.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <h3 className="mb-3 text-base font-semibold">Pinned Quests</h3>
            <ul className="space-y-3">
              {(session ? pinnedQuests : latest).map((quest) => (
                <li key={quest.uri} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                  <p className="font-medium">{quest.name}</p>
                  <p className="mt-1 text-sm text-stone-600">
                    {quest.description ?? "No description yet."}
                  </p>
                  {session && quest.did === session.did && (
                    <Link
                      href={`/quests/${quest.rkey}`}
                      className="mt-2 inline-block text-xs text-stone-700 underline"
                    >
                      Open quest
                    </Link>
                  )}
                </li>
              ))}
              {(session ? pinnedQuests : latest).length === 0 && (
                <li className="text-sm text-stone-500">No quests yet.</li>
              )}
            </ul>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <h3 className="mb-3 text-base font-semibold">Recent Activity</h3>
            <ul className="space-y-2 text-sm">
              {recentActivity.map((item) => (
                <li key={item.uri} className="flex items-center gap-2 border-b border-stone-100 pb-2">
                  <span className="text-stone-500">@{item.handle ?? item.did}</span>
                  <span className="text-stone-700">{item.message}</span>
                  <span className="ml-auto text-xs text-stone-400">{timeAgo(item.createdAt)}</span>
                </li>
              ))}
              {recentActivity.length === 0 && (
                <li className="text-stone-500">No activity yet.</li>
              )}
            </ul>
          </div>

          {q.trim().length > 0 && (
            <div className="rounded-xl border border-stone-200 bg-white p-5">
              <h3 className="mb-3 text-base font-semibold">Search Results</h3>
              <ul className="space-y-2 text-sm">
                {searched.map((quest) => (
                  <li key={quest.uri}>
                    <span className="font-medium">{quest.name}</span>
                    <span className="ml-2 text-stone-500">{quest.did}</span>
                    {session && quest.did === session.did && (
                      <Link href={`/quests/${quest.rkey}`} className="ml-3 underline">
                        open
                      </Link>
                    )}
                  </li>
                ))}
                {searched.length === 0 && <li className="text-stone-500">No matches.</li>}
              </ul>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            {session ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-stone-600">Signed in as @{accountHandle ?? session.did}</p>
                  <LogoutButton />
                </div>
                <CreateQuestForm />
              </div>
            ) : (
              <LoginForm />
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
