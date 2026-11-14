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
  timezone: string | null;
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

export type KeyedStoreObservation<T> = {
  value: T | undefined;
  comparison: string;
};

export type KeyedStoreCompareIntent<T> =
  | { operation: 'update'; action: 'set'; value: T; ttlMs?: number }
  | { operation: 'update' | 'delete'; action: 'keep' }
  | { operation: 'delete'; action: 'delete' };

export type KeyedStoreCompareResult<T> =
  | { status: 'applied' | 'unchanged' }
  | { status: 'conflict'; current: KeyedStoreObservation<T> };

/** The subset of the host v2 keyed store this plugin uses. */
export type KeyedStore<T> = {
  observe(key: string): Promise<KeyedStoreObservation<T>>;
  compareAndApply(
    key: string,
    comparison: string,
    intent: KeyedStoreCompareIntent<T>,
  ): Promise<KeyedStoreCompareResult<T>>;
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
