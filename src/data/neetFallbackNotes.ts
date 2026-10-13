import { resolveNeetNotesForTitle } from './neetChapterDatabase';

export function getClientStructuredNotes(videoTitle: string, subject: string): string {
  const resolved = resolveNeetNotesForTitle(videoTitle, subject);
  return `${resolved.page1}\n\n${resolved.page2}`;
}
