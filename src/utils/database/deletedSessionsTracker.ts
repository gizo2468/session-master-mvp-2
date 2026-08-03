const deletedSessionIds = new Set<string>();

export const markSessionAsDeleted = (sessionId: string) => {
  deletedSessionIds.add(sessionId);
};

export const isSessionDeleted = (sessionId: string): boolean => {
  return deletedSessionIds.has(sessionId);
};
