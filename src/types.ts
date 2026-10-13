export type NeetSubject = 'Physics' | 'Chemistry' | 'Biology' | 'General NEET';

export interface VideoInfo {
  videoId: string;
  canonicalUrl: string;
  title: string;
  authorName: string;
  thumbnailUrl: string;
  subject: NeetSubject;
  sessionResetTimestamp?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  timestamp: number;
  presetType?: 'notes' | 'formula' | 'pyq' | 'mcq' | 'custom';
}

export interface MCQOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface PracticeMCQ {
  id: string;
  question: string;
  options: MCQOption[];
  correctKey: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  ncertReference?: string;
  year?: string;
}

export interface TwoPageNotes {
  page1: {
    title: string;
    coreConcepts: string[];
    ncertDefinitions: string[];
    highYieldTakeaways: string[];
    commonTraps: string[];
  };
  page2: {
    title: string;
    formulaBank: { formula: string; description: string; unit?: string }[];
    shortcutTricks: string[];
    pyqHighlights: { year: string; question: string; concept: string }[];
  };
  rawMarkdown?: string;
}
