import type { Knex } from "knex";
import { db } from "../config/db.js";

export interface SurveyRecord {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  status: "draft" | "active" | "closed";
  public_token: string | null;
  access_code: string | null;
  start_date: string | null;
  end_date: string | null;
  max_responses: number | null;
  response_count: number;
  is_template: boolean;
}

/** Fetches all surveys owned by a user. */
export function listSurveys(userId: number) {
  return db("surveys").where({ user_id: userId }).orderBy("updated_at", "desc");
}

/** Fetches one survey row by id and owner. */
export function findSurveyById(id: number, userId: number) {
  return db("surveys").where({ id, user_id: userId }).first();
}

/** Fetches one public survey by token. */
export function findSurveyByToken(token: string) {
  return db("surveys").where({ public_token: token }).first();
}

/** Inserts a survey metadata record. */
export function createSurvey(data: Partial<SurveyRecord>) {
  return db("surveys")
    .insert(data)
    .returning("*")
    .then((rows) => rows[0]);
}

/** Updates survey metadata for an owner. */
export function updateSurvey(
  id: number,
  userId: number,
  data: Partial<SurveyRecord>,
) {
  return db("surveys")
    .where({ id, user_id: userId })
    .update({ ...data, updated_at: db.fn.now() })
    .returning("*")
    .then((rows) => rows[0]);
}

/** Deletes a survey for an owner. */
export function deleteSurvey(id: number, userId: number) {
  return db("surveys").where({ id, user_id: userId }).delete();
}

/** Lists ordered questions and options for a survey. */
export async function listQuestions(
  surveyId: number,
  connection: Knex | Knex.Transaction = db,
) {
  const questions = await connection("questions")
    .where({ survey_id: surveyId })
    .orderBy("sort_order", "asc");
  const options = await connection("question_options")
    .whereIn(
      "question_id",
      questions.map((question) => question.id),
    )
    .orderBy("sort_order", "asc");
  return questions.map((question) => ({
    ...question,
    options: options.filter((option) => option.question_id === question.id),
  }));
}

/** Inserts a question and optional choices inside a transaction. */
export async function insertQuestion(
  trx: Knex.Transaction,
  surveyId: number,
  data: Record<string, unknown>,
) {
  const [question] = await trx("questions")
    .insert({
      survey_id: surveyId,
      question_type: data.question_type,
      title: data.title,
      description: data.description,
      is_required: data.is_required,
      sort_order: data.sort_order,
      config: data.config,
    })
    .returning("*");
  const options =
    (data.options as
      | Array<{ label: string; sort_order?: number }>
      | undefined) ?? [];
  if (options.length) {
    await trx("question_options").insert(
      options.map((option, index) => ({
        question_id: question.id,
        label: option.label,
        sort_order: option.sort_order ?? index + 1,
      })),
    );
  }
  return question;
}

/** Replaces editable question fields and options. */
export async function updateQuestion(
  id: number,
  data: Record<string, unknown>,
) {
  return db.transaction(async (trx) => {
    const [question] = await trx("questions")
      .where({ id })
      .update({
        title: data.title,
        description: data.description,
        is_required: data.is_required,
        config: data.config,
      })
      .returning("*");
    if (Array.isArray(data.options)) {
      await trx("question_options").where({ question_id: id }).delete();
      const options = data.options as Array<{
        label: string;
        sort_order?: number;
      }>;
      if (options.length) {
        await trx("question_options").insert(
          options.map((option, index) => ({
            question_id: id,
            label: option.label,
            sort_order: option.sort_order ?? index + 1,
          })),
        );
      }
    }
    return question;
  });
}

/** Deletes a question and cascades options and answers. */
export function deleteQuestion(id: number) {
  return db("questions").where({ id }).delete();
}

/** Updates question sort order from a list of ids. */
export async function reorderQuestions(
  surveyId: number,
  questionIds: number[],
) {
  await db.transaction(async (trx) => {
    await Promise.all(
      questionIds.map((id, index) =>
        trx("questions")
          .where({ id, survey_id: surveyId })
          .update({ sort_order: index + 1 }),
      ),
    );
  });
}

/** Inserts one response and all answer rows. */
export async function createResponse(
  trx: Knex.Transaction,
  surveyId: number,
  ip: string | undefined,
  answers: Array<Record<string, unknown>>,
) {
  const [response] = await trx("responses")
    .insert({
      survey_id: surveyId,
      respondent_ip: ip,
      completed_at: trx.fn.now(),
    })
    .returning("*");
  if (answers.length) {
    await trx("response_answers").insert(
      answers.map((answer) => ({ ...answer, response_id: response.id })),
    );
  }
  await trx("surveys")
    .where({ id: surveyId })
    .increment("response_count", 1)
    .update({ updated_at: trx.fn.now() });
  return response;
}

/** Lists raw response rows with their answers. */
export async function listResponses(surveyId: number, limit = 50, offset = 0) {
  const responses = await db("responses")
    .where({ survey_id: surveyId })
    .orderBy("completed_at", "desc")
    .limit(limit)
    .offset(offset);
  const answers = await db("response_answers").whereIn(
    "response_id",
    responses.map((response) => response.id),
  );
  return responses.map((response) => ({
    ...response,
    answers: answers.filter((answer) => answer.response_id === response.id),
  }));
}

/** Loads all answers for result aggregation. */
export function listAnswers(surveyId: number) {
  return db("response_answers")
    .join("responses", "responses.id", "response_answers.response_id")
    .where("responses.survey_id", surveyId)
    .select("response_answers.*");
}
