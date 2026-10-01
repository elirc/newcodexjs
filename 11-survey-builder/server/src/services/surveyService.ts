import crypto from "node:crypto";
import { db } from "../config/db.js";
import { NotFoundError, ValidationError } from "../middleware/errors.js";
import * as surveys from "../models/surveyModel.js";
import { csvCell } from "../utils/http.js";

/** Loads a survey with ordered questions and options. */
export async function getSurvey(id: number, userId: number) {
  const survey = await surveys.findSurveyById(id, userId);
  if (!survey) throw new NotFoundError("Survey not found");
  return { ...survey, questions: await surveys.listQuestions(id) };
}

/** Creates a survey owned by the demo user. */
export function createSurvey(userId: number, data: Record<string, unknown>) {
  return surveys.createSurvey({ ...data, user_id: userId, status: "draft" });
}

/** Activates a survey and creates its public token if needed. */
export async function activateSurvey(id: number, userId: number) {
  const survey = await surveys.findSurveyById(id, userId);
  if (!survey) throw new NotFoundError("Survey not found");
  const token = survey.public_token ?? crypto.randomBytes(24).toString("hex");
  return surveys.updateSurvey(id, userId, {
    status: "active",
    public_token: token,
  });
}

/** Closes a survey so public responses stop. */
export function closeSurvey(id: number, userId: number) {
  return surveys.updateSurvey(id, userId, { status: "closed" });
}

/** Adds a question at the bottom of the survey. */
export async function addQuestion(
  surveyId: number,
  data: Record<string, unknown>,
) {
  return db.transaction(async (trx) => {
    const [{ max }] = await trx("questions")
      .where({ survey_id: surveyId })
      .max("sort_order as max");
    return surveys.insertQuestion(trx, surveyId, {
      ...data,
      sort_order: data.sort_order ?? Number(max ?? 0) + 1,
    });
  });
}

/** Returns public survey data after checking status, dates, and limits. */
export async function getPublicSurvey(token: string) {
  const survey = await surveys.findSurveyByToken(token);
  if (!survey) throw new NotFoundError("Survey not found");
  assertAccepting(survey);
  return { ...survey, questions: await surveys.listQuestions(survey.id) };
}

/** Converts respondent answer payloads into typed answer rows. */
function buildAnswerRows(
  questions: Array<Record<string, any>>,
  answers: Record<string, unknown>,
) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers))
    throw new ValidationError("Answers must be an object");
  const known = new Set(questions.map((q) => String(q.id)));
  if (Object.keys(answers).some((key) => !known.has(key)))
    throw new ValidationError("Unknown question");
  return questions.map((question) => {
    const value = answers[String(question.id)];
    const base = { question_id: question.id };
    const blank =
      value == null ||
      (typeof value === "string" && !value.trim()) ||
      (Array.isArray(value) && !value.length);
    if (blank) {
      if (question.is_required)
        throw new ValidationError(`Missing answer for ${question.title}`);
      return { ...base, answer_text: null };
    }
    const invalid = () =>
      new ValidationError(`Invalid answer for ${question.title}`);
    if (["single_choice", "yes_no"].includes(question.question_type)) {
      const option = question.options.find((item: any) => item.label === value);
      if (
        !option &&
        !(
          question.question_type === "yes_no" &&
          ["Yes", "No"].includes(value as string)
        )
      )
        throw invalid();
      return {
        ...base,
        selected_option_id: option?.id ?? null,
        answer_text: value,
      };
    }
    if (question.question_type === "multi_choice") {
      if (
        !Array.isArray(value) ||
        value.some(
          (label) =>
            typeof label !== "string" ||
            !question.options.some((o: any) => o.label === label),
        )
      )
        throw invalid();
      const labels = [...new Set(value)];
      return {
        ...base,
        selected_option_ids: question.options
          .filter((o: any) => labels.includes(o.label))
          .map((o: any) => o.id),
        answer_text: labels.join("; "),
      };
    }
    if (question.question_type === "rating") {
      if (
        (typeof value !== "string" && typeof value !== "number") ||
        !Number.isInteger(Number(value)) ||
        Number(value) < (question.config?.min ?? 1) ||
        Number(value) > (question.config?.max ?? 5)
      )
        throw invalid();
      return { ...base, rating_value: Number(value) };
    }
    if (question.question_type === "matrix") {
      if (typeof value !== "object" || Array.isArray(value)) throw invalid();
      const entries = Object.entries(value as object),
        rows = question.config?.rows ?? [],
        columns = question.config?.columns ?? [];
      if (
        entries.some(
          ([row, column]) => !rows.includes(row) || !columns.includes(column),
        ) ||
        (question.is_required &&
          rows.some((row: string) => !(row in (value as object))))
      )
        throw invalid();
      return { ...base, matrix_answers: value };
    }
    if (typeof value !== "string" && typeof value !== "number") throw invalid();
    if (String(value).length > 20000) throw invalid();
    if (question.question_type === "number" && !Number.isFinite(Number(value)))
      throw invalid();
    if (
      question.question_type === "date" &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(String(value)) ||
        !Number.isFinite(Date.parse(String(value))) ||
        new Date(String(value)).toISOString().slice(0, 10) !== value)
    )
      throw invalid();
    return { ...base, answer_text: String(value) };
  });
}

function assertAccepting(survey: any) {
  if (survey.status !== "active")
    throw new ValidationError("Survey is not accepting responses");
  const now = Date.now();
  if (survey.start_date && new Date(survey.start_date).getTime() > now)
    throw new ValidationError("Survey has not opened yet");
  if (survey.end_date && new Date(survey.end_date).getTime() <= now)
    throw new ValidationError("Survey has closed");
  if (survey.max_responses && survey.response_count >= survey.max_responses)
    throw new ValidationError("Survey response limit reached");
}

/** Lock the survey before checking capacity; the answer rows and counter commit together. */
export async function submitResponse(
  token: string,
  ip: string | undefined,
  body: { accessCode?: string; answers: Record<string, unknown> },
) {
  return db.transaction(async (trx) => {
    const survey = await trx("surveys")
      .where({ public_token: token })
      .forUpdate()
      .first();
    if (!survey) throw new NotFoundError("Survey not found");
    assertAccepting(survey);
    if (survey.access_code && body.accessCode !== survey.access_code)
      throw new ValidationError("Invalid access code");
    const questions = await surveys.listQuestions(survey.id, trx);
    return surveys.createResponse(
      trx,
      survey.id,
      ip,
      buildAnswerRows(questions, body.answers),
    );
  });
}

/** Aggregates answers per question for dashboard charts. */
export async function getResults(surveyId: number, userId: number) {
  const survey = await getSurvey(surveyId, userId);
  const answers = await surveys.listAnswers(surveyId);
  const questions = survey.questions.map((question: any) => {
    const questionAnswers = answers.filter(
      (answer: any) => answer.question_id === question.id,
    );
    const result: any = { question, totalAnswers: questionAnswers.length };
    if (
      question.question_type === "single_choice" ||
      question.question_type === "multi_choice" ||
      question.question_type === "yes_no"
    ) {
      const labels =
        question.question_type === "yes_no"
          ? ["Yes", "No"]
          : question.options.map((option: any) => option.label);
      result.options = labels.map((label: string) => ({
        label,
        count: questionAnswers.filter((answer: any) =>
          String(answer.answer_text).split("; ").includes(label),
        ).length,
      }));
    } else if (question.question_type === "rating") {
      const ratings = questionAnswers
        .map((answer: any) => Number(answer.rating_value))
        .filter(Boolean);
      result.average = ratings.length
        ? ratings.reduce((sum: number, value: number) => sum + value, 0) /
          ratings.length
        : null;
    } else if (question.question_type === "matrix") {
      result.matrix = {};
      questionAnswers.forEach((answer: any) => {
        Object.entries(answer.matrix_answers ?? {}).forEach(([row, column]) => {
          result.matrix[row] = result.matrix[row] ?? {};
          result.matrix[row][String(column)] =
            (result.matrix[row][String(column)] ?? 0) + 1;
        });
      });
    } else {
      result.textAnswers = questionAnswers
        .map((answer: any) => answer.answer_text)
        .filter(Boolean);
    }
    return result;
  });
  return { survey, totalResponses: survey.response_count, questions };
}

/** Exports raw responses as a simple CSV file. */
export async function exportResponses(surveyId: number, userId: number) {
  const survey = await getSurvey(surveyId, userId);
  const responses = await surveys.listResponses(surveyId, 1000, 0);
  const headers = [
    "response_id",
    "completed_at",
    ...survey.questions.map((question: any) => question.title),
  ];
  const rows = responses.map((response: any) => {
    const cells = survey.questions.map((question: any) => {
      const answer = response.answers.find(
        (item: any) => item.question_id === question.id,
      );
      return (
        answer?.answer_text ??
        answer?.rating_value ??
        JSON.stringify(answer?.matrix_answers ?? "")
      );
    });
    return [response.id, response.completed_at, ...cells]
      .map(csvCell)
      .join(",");
  });
  return [headers.map(csvCell).join(","), ...rows].join("\n");
}

/** Duplicates an existing survey as a draft template-derived survey. */
export async function duplicateSurvey(id: number, userId: number) {
  const original = await getSurvey(id, userId);
  return db.transaction(async (trx) => {
    const [copy] = await trx("surveys")
      .insert({
        user_id: userId,
        title: `${original.title} copy`,
        description: original.description,
        status: "draft",
        is_template: false,
      })
      .returning("*");
    for (const question of original.questions as any[]) {
      await surveys.insertQuestion(trx, copy.id, question);
    }
    return copy;
  });
}
