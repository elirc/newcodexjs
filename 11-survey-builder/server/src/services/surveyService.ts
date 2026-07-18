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
  return surveys.updateSurvey(id, userId, { status: "active", public_token: token });
}

/** Closes a survey so public responses stop. */
export function closeSurvey(id: number, userId: number) {
  return surveys.updateSurvey(id, userId, { status: "closed" });
}

/** Adds a question at the bottom of the survey. */
export async function addQuestion(surveyId: number, data: Record<string, unknown>) {
  return db.transaction(async (trx) => {
    const [{ max }] = await trx("questions").where({ survey_id: surveyId }).max("sort_order as max");
    return surveys.insertQuestion(trx, surveyId, { ...data, sort_order: data.sort_order ?? Number(max ?? 0) + 1 });
  });
}

/** Returns public survey data after checking status, dates, and limits. */
export async function getPublicSurvey(token: string) {
  const survey = await surveys.findSurveyByToken(token);
  if (!survey) throw new NotFoundError("Survey not found");
  if (survey.status !== "active") throw new ValidationError("Survey is not accepting responses");
  if (survey.max_responses && survey.response_count >= survey.max_responses) throw new ValidationError("Survey response limit reached");
  return { ...survey, questions: await surveys.listQuestions(survey.id) };
}

/** Converts respondent answer payloads into typed answer rows. */
function buildAnswerRows(questions: Array<Record<string, any>>, answers: Record<string, unknown>) {
  return questions.map((question) => {
    const value = answers[String(question.id)];
    const base = { question_id: question.id };
    if (question.is_required && (value == null || value === "")) throw new ValidationError(`Missing answer for ${question.title}`);
    if (question.question_type === "single_choice" || question.question_type === "yes_no") {
      const option = question.options.find((item: any) => item.label === value);
      return option ? { ...base, selected_option_id: option.id, answer_text: String(value) } : { ...base, answer_text: String(value ?? "") };
    }
    if (question.question_type === "multi_choice") {
      const selectedLabels = Array.isArray(value) ? value.map(String) : [];
      const ids = question.options.filter((item: any) => selectedLabels.includes(item.label)).map((item: any) => item.id);
      return { ...base, selected_option_ids: ids, answer_text: selectedLabels.join("; ") };
    }
    if (question.question_type === "rating") return { ...base, rating_value: Number(value) };
    if (question.question_type === "matrix") return { ...base, matrix_answers: value };
    return { ...base, answer_text: value == null ? null : String(value) };
  });
}

/** Records a public response and increments the survey counter atomically. */
export async function submitResponse(token: string, ip: string | undefined, body: { accessCode?: string; answers: Record<string, unknown> }) {
  const survey = await getPublicSurvey(token);
  if (survey.access_code && body.accessCode !== survey.access_code) throw new ValidationError("Invalid access code");
  return db.transaction((trx) => surveys.createResponse(trx, survey.id, ip, buildAnswerRows(survey.questions, body.answers)));
}

/** Aggregates answers per question for dashboard charts. */
export async function getResults(surveyId: number, userId: number) {
  const survey = await getSurvey(surveyId, userId);
  const answers = await surveys.listAnswers(surveyId);
  const questions = survey.questions.map((question: any) => {
    const questionAnswers = answers.filter((answer: any) => answer.question_id === question.id);
    const result: any = { question, totalAnswers: questionAnswers.length };
    if (question.question_type === "single_choice" || question.question_type === "multi_choice" || question.question_type === "yes_no") {
      const labels = question.question_type === "yes_no" ? ["Yes", "No"] : question.options.map((option: any) => option.label);
      result.options = labels.map((label: string) => ({ label, count: questionAnswers.filter((answer: any) => String(answer.answer_text).split("; ").includes(label)).length }));
    } else if (question.question_type === "rating") {
      const ratings = questionAnswers.map((answer: any) => Number(answer.rating_value)).filter(Boolean);
      result.average = ratings.length ? ratings.reduce((sum: number, value: number) => sum + value, 0) / ratings.length : null;
    } else if (question.question_type === "matrix") {
      result.matrix = {};
      questionAnswers.forEach((answer: any) => {
        Object.entries(answer.matrix_answers ?? {}).forEach(([row, column]) => {
          result.matrix[row] = result.matrix[row] ?? {};
          result.matrix[row][String(column)] = (result.matrix[row][String(column)] ?? 0) + 1;
        });
      });
    } else {
      result.textAnswers = questionAnswers.map((answer: any) => answer.answer_text).filter(Boolean);
    }
    return result;
  });
  return { survey, totalResponses: survey.response_count, questions };
}

/** Exports raw responses as a simple CSV file. */
export async function exportResponses(surveyId: number, userId: number) {
  const survey = await getSurvey(surveyId, userId);
  const responses = await surveys.listResponses(surveyId, 1000, 0);
  const headers = ["response_id", "completed_at", ...survey.questions.map((question: any) => question.title)];
  const rows = responses.map((response: any) => {
    const cells = survey.questions.map((question: any) => {
      const answer = response.answers.find((item: any) => item.question_id === question.id);
      return answer?.answer_text ?? answer?.rating_value ?? JSON.stringify(answer?.matrix_answers ?? "");
    });
    return [response.id, response.completed_at, ...cells].map(csvCell).join(",");
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
        is_template: false
      })
      .returning("*");
    for (const question of original.questions as any[]) {
      await surveys.insertQuestion(trx, copy.id, question);
    }
    return copy;
  });
}

