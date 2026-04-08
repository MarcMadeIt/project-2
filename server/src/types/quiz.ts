export type QuestionType = "single_choice" | "multiple_choice" | "cloze";

export interface QuizFile {
  quizzes: Quiz[];
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  language: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowedHtmlTags: string[];
  allowedHtmlStyles: string[];
  rules: {
    singleChoicePoints: number;
    multipleChoicePoints: number;
    clozePoints: number;
    multipleChoiceScoring: {
      mode: string;
      description: string;
    };
  };
  questions: Question[];
}

export interface Option {
  id: string;
  text: string;
}

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  questionText: string;
  explanation?: string;
}

export interface SingleChoiceQuestion extends BaseQuestion {
  type: "single_choice";
  options: Option[];
  correctAnswers: string[];
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple_choice";
  options: Option[];
  correctAnswers: string[];
}

export interface ClozeQuestion extends BaseQuestion {
  type: "cloze";
  acceptedAnswers: string[];
  caseSensitive: boolean;
  trimWhitespace: boolean;
}

export type Question =
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | ClozeQuestion;

  export interface StoredAnswerResult {
  questionId: string;
  userAnswer: string[] | string;
  correct: boolean;
  points: number;
  maxPoints: number;
  correctAnswer: { id: string; text: string }[] | string[];
}

export interface StoredQuizResult {
  id: string;
  userId: string;
  quizId: string;
  quizTitle: string;
  totalPoints: number;
  maxPoints: number;
  percentage: number;
  submittedAt: string;
  answers: StoredAnswerResult[];
}

export interface ResultsFile {
  results: StoredQuizResult[];
}

export interface CreateQuizRequest {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  questions: CreateQuestionRequest[];
}

export type CreateQuestionRequest =
  | CreateSingleChoiceQuestionRequest
  | CreateMultipleChoiceQuestionRequest
  | CreateClozeQuestionRequest;

export interface CreateOptionRequest {
  text: string;
}

export interface CreateSingleChoiceQuestionRequest {
  type: "single_choice";
  questionText: string;
  options: CreateOptionRequest[];
  correctAnswers: number[];
}

export interface CreateMultipleChoiceQuestionRequest {
  type: "multiple_choice";
  questionText: string;
  options: CreateOptionRequest[];
  correctAnswers: number[];
}

export interface CreateClozeQuestionRequest {
  type: "cloze";
  questionText: string;
  acceptedAnswers: string[];
  caseSensitive?: boolean;
  trimWhitespace?: boolean;
}