export const ATHUB_COLLECTIONS = {
  quest: "app.athub.repo",
  proposal: "app.athub.issue",
  contribution: "app.athub.commit",
  badge: "app.athub.award",
} as const;

export const BADGE_TYPES = [
  "continuous",
  "insightful",
  "collaborator",
  "brave",
] as const;

export type AthubCollection =
  (typeof ATHUB_COLLECTIONS)[keyof typeof ATHUB_COLLECTIONS];

export type BadgeType = (typeof BADGE_TYPES)[number];

export function isAthubCollection(value: string): value is AthubCollection {
  return Object.values(ATHUB_COLLECTIONS).includes(value as AthubCollection);
}

export function isBadgeType(value: string): value is BadgeType {
  return BADGE_TYPES.includes(value as BadgeType);
}
