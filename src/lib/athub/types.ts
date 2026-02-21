import type { BadgeType } from "./collections";

export interface StrongRef {
  uri: string;
  cid: string;
}

export interface QuestRecord {
  name: string;
  description?: string;
  topics?: string[];
  createdAt: string;
}

export interface ProposalRecord {
  repoRef: StrongRef;
  title: string;
  body?: string;
  state: "open" | "closed";
  bskyThreadUri?: string;
  createdAt: string;
}

export interface ContributionMediaItem {
  blob: unknown;
  mimeType: string;
  size: number;
  originalName?: string;
}

export interface ContributionRecord {
  repoRef: StrongRef;
  message: string;
  body?: string;
  media?: ContributionMediaItem[];
  createdAt: string;
}

export interface BadgeRecord {
  subject: StrongRef;
  badgeType: BadgeType;
  comment: string;
  createdAt: string;
}
