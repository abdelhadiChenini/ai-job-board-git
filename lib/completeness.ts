export type CompletenessProfile = {
  bio?: string | null;
  skills?: unknown;
  hourlyRate?: string | null;
  country?: string | null;
  stateRegion?: string | null;
  languages?: string | null;
  education?: string | null;
};

export function calculateCompleteness(
  profile: CompletenessProfile | null | undefined,
): number {
  if (!profile) return 0;

  const fields: boolean[] = [
    Boolean(profile.bio?.trim()),
    Array.isArray(profile.skills) && profile.skills.length > 0,
    Boolean(profile.hourlyRate?.trim()),
    Boolean(profile.country?.trim() || profile.stateRegion?.trim()),
    Boolean(profile.languages?.trim()),
    Boolean(profile.education?.trim()),
  ];

  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}
