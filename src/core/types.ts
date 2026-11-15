export interface RawVerb {
  spanish: string;
  present: string;
  past: string;
  participle: string;
}

export interface ParsedField {
  operator: 'AND' | 'OR' | 'SINGLE';
  options: string[];
}

export type VerbField = 'spanish' | 'present' | 'past' | 'participle';

export const VERB_FIELDS: readonly VerbField[] = ['spanish', 'present', 'past', 'participle'];

export interface ParsedVerb {
  index: number;
  spanish: string; // Formatted for display (e.g., "ser / estar")
  rawSpanish: string;
  spanishField: ParsedField;
  present: ParsedField;
  past: ParsedField;
  participle: ParsedField;
  raw: RawVerb;
}

export interface FieldValidationResult {
  isValid: boolean;
  expected: string[];
  operator: 'AND' | 'OR' | 'SINGLE';
  userInput: string;
  missingOptions?: string[];
}

export interface VerbValidationResult {
  isValid: boolean;
  givenField: VerbField;
  spanish: FieldValidationResult;
  present: FieldValidationResult;
  past: FieldValidationResult;
  participle: FieldValidationResult;
}

export type ChallengeType = 1 | 2 | 3 | 4; // 1, 2, 3: standard challenges, 4: final challenge

export interface ChallengeConfig {
  levelNumber: number;
  challengeIndex: number; // 0, 1, 2 (desafíos 1-3) or 3 (desafío final)
  maxAllowedErrors: number; // 2, 1, 0, 0
  verbs: ParsedVerb[];
}

export interface ChallengeItem {
  verb: ParsedVerb;
  isRetry: boolean;
  givenField: VerbField; // Campo que se muestra al usuario; el resto debe rellenarlo
}

export type ChallengeStatus = 'idle' | 'playing' | 'feedback_error' | 'victory' | 'defeat';

export interface ChallengeState {
  levelNumber: number;
  challengeIndex: number;
  maxAllowedErrors: number;
  errorsCommitted: number;
  heartsRemaining: number;
  status: ChallengeStatus;
  currentVerb: ParsedVerb | null;
  currentGivenField: VerbField;
  currentIsRetry: boolean;
  queue: ChallengeItem[];
  totalInitialQuestions: number;
  completedQuestionsCount: number;
  lastValidationResult: VerbValidationResult | null;
  starsEarned: number;
  startedAt: number;
  finishedAt: number | null;
}

export interface VerbStatsEntry {
  timesAsked: number;
  timesFailed: number;
  lastPracticedTimestamp: number;
}

export interface ChallengeProgressEntry {
  completed: boolean;
  bestStars: number;
  attempts: number;
}

export interface LevelProgressEntry {
  challenges: {
    [challengeIndex: number]: ChallengeProgressEntry;
  };
}

export interface AppSettings {
  soundEnabled: boolean;
  reducedMotion: boolean;
}

export interface AppProgress {
  unlockedLevel: number; // 1 to 20
  levels: {
    [levelNumber: number]: LevelProgressEntry;
  };
}

export interface AppStatistics {
  totalPlayTimeSeconds: number;
  totalAnswersCorrect: number;
  totalAnswersFailed: number;
  lastPlayedTimestamp: number | null;
  lastPlayedResult: 'victory' | 'defeat' | null;
  currentStreakDays: number;
  bestStreakDays: number;
  lastActiveDateString: string | null; // YYYY-MM-DD
  activeDaysHistory: { [dateString: string]: number };
  verbsStats: {
    [verbIndex: number]: VerbStatsEntry;
  };
}

export interface AppStorageState {
  schemaVersion: number;
  settings: AppSettings;
  progress: AppProgress;
  statistics: AppStatistics;
}
