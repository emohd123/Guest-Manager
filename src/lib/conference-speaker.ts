export function isAssignedConferenceSpeaker(assigned: string | null | undefined, name: string) {
  const normalizedName = name.trim().toLocaleLowerCase();
  if (!normalizedName) return false;
  return (assigned ?? "").split(/,|&/).some(
    (speaker) => speaker.trim().toLocaleLowerCase() === normalizedName,
  );
}

export function withoutSpeakerCredentials<T extends { speakerAccessCode?: string }>(sessions: T[]) {
  return sessions.map((session) => {
    const safe = { ...session };
    delete safe.speakerAccessCode;
    return safe;
  });
}

export function attendeeConferenceSettings<T extends { sessionDetails?: Record<string, { speakerAccessCode?: string }> }>(settings: T): T {
  if (!settings.sessionDetails) return settings;
  return {
    ...settings,
    sessionDetails: Object.fromEntries(Object.entries(settings.sessionDetails).map(
      ([id, detail]) => [id, withoutSpeakerCredentials([detail])[0]],
    )),
  };
}
