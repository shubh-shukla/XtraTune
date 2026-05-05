export interface HistoryInput {
  userId: string;
  songId: string;
  title: string;
  artist: string;
  language: string;
}

export function buildHistoryUpdate(input: HistoryInput) {
  const now = new Date();
  return {
    filter: { userId: input.userId, songId: input.songId },
    update: {
      $inc: { playCount: 1 },
      $set: { lastPlayedAt: now },
      $setOnInsert: {
        userId: input.userId,
        songId: input.songId,
        title: input.title,
        artist: input.artist,
        language: input.language,
      },
    },
    options: { upsert: true as const },
  };
}
