export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer';

export type RevealMode = 'none' | 'always' | 'score_threshold';

export type QuizStatus = 'draft' | 'published' | 'closed';

export interface QuestionOption {
  id: string; // 'A', 'B', 'C', 'D' or 'a', 'b', 'c', 'd'
  text: string;
}

export interface Question {
  id: string;
  order: number;
  type: QuestionType;
  content: string;
  options: QuestionOption[];
  correctAnswer: string | string[]; // Single: 'A', Multiple: ['A', 'C'], TrueFalse: { a: 'Đ', b: 'S' } as string, Short: text
  explanation?: string;
  points: number; // default 1
}

// Sanitized question sent to students during exam (NEVER contains correctAnswer or explanation)
export interface StudentQuestion {
  id: string;
  order: number;
  type: QuestionType;
  content: string;
  options: QuestionOption[];
  points: number;
}

export interface QuizSettings {
  title: string;
  subject: string;
  grade: string;
  durationMinutes: number; // 0 for unlimited
  maxScore: number; // default 10
  hasPassword: boolean;
  password?: string;
  passwordHash?: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  maxAttempts: number; // 1 or 0 (unlimited)
  showScoreImmediately: boolean;
  revealAnswersMode: RevealMode;
  minScoreToRevealAnswers: number;
  revealExplanationsMode: RevealMode;
  minScoreToRevealExplanations: number;
  allowRetake: boolean;
  requireSchoolName?: boolean;
}

export interface Quiz extends QuizSettings {
  id: string;
  publicCode: string; // e.g. "QP-849201"
  status: QuizStatus;
  ownerUid: string;
  ownerEmail: string;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  publicCode: string;
  studentName: string;
  studentClass: string;
  schoolName?: string;
  score: number;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  startedAt: string;
  submittedAt: string;
  answers: Record<string, string | string[]>; // questionId -> student choice
  canViewAnswers: boolean;
  canViewExplanations: boolean;
}

export interface GradedResult {
  attemptId: string;
  score: number;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  totalQuestions: number;
  canViewAnswers: boolean;
  canViewExplanations: boolean;
  minScoreToRevealAnswers?: number;
  minScoreToRevealExplanations?: number;
  revealAnswersMode: RevealMode;
  details?: Record<string, {
    isCorrect: boolean;
    studentAnswer: string | string[];
    correctAnswer?: string | string[];
    explanation?: string;
  }>;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'teacher' | 'admin';
  createdAt: string;
  updatedAt?: string;
}
