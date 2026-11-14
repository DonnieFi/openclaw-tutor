export type Topic = {
  subject: string;
  title: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type Assessment = {
  subject: string;
  title: string;
  date: string;
  time: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type CalendarItem = {
  title: string;
  date: string;
  time?: string;
  subject?: string;
  source?: string;
};

export type TutorSetup = {
  calendarTool: string | null;
  calendarReminderShownAt: string | null;
  updatedAt: string | null;
};

export type StudyGuide = {
  key: string;
  title: string;
  subject: string;
  date: string;
  time: string | null;
  markdown: string;
  generatedAt: string;
};

export type TutorState = {
  version: 1;
  setup: TutorSetup;
  topics: Topic[];
  assessments: Assessment[];
  guides: StudyGuide[];
};

export type KeyedStore<T> = {
  lookup(key: string): Promise<T | undefined>;
  register(key: string, value: T, opts?: { assertCurrent?: () => void }): Promise<void>;
};

export type CallScope = {
  agentId: string;
  signal?: AbortSignal;
  assertCurrent: () => void;
};

export type MergedAssessment = Assessment & {
  source: 'tutor' | 'calendar' | 'both';
  sources: string[];
};
