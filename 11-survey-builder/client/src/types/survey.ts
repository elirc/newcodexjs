export type QuestionType =
  | "short_text"
  | "long_text"
  | "single_choice"
  | "multi_choice"
  | "rating"
  | "yes_no"
  | "number"
  | "date"
  | "matrix";

export type SurveyStatus = "draft" | "active" | "closed";

export interface QuestionOption {
  id: number;
  question_id: number;
  label: string;
  sort_order: number;
}

export interface Question {
  id: number;
  survey_id: number;
  question_type: QuestionType;
  title: string;
  description?: string | null;
  is_required: boolean;
  sort_order: number;
  config?: Record<string, unknown> | null;
  options: QuestionOption[];
}

export interface Survey {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  status: SurveyStatus;
  public_token?: string | null;
  access_code?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  max_responses?: number | null;
  response_count: number;
  is_template: boolean;
  questions?: Question[];
}

export interface ResultQuestion {
  question: Question;
  totalAnswers: number;
  options?: Array<{ label: string; count: number }>;
  average?: number | null;
  textAnswers?: string[];
  matrix?: Record<string, Record<string, number>>;
}

