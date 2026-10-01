import type { Request, Response } from "express";
import * as model from "../models/surveyModel.js";
import * as service from "../services/surveyService.js";
import { sendSuccess } from "../utils/http.js";

/** Reads the demo user id from headers for educational authenticated routes. */
function userId(req: Request): number {
  return Number(req.header("x-demo-user-id") ?? process.env.DEMO_USER_ID ?? 1);
}

/** Lists surveys for the current demo user. */
export async function listSurveys(req: Request, res: Response) {
  sendSuccess(res, await model.listSurveys(userId(req)));
}

/** Gets a single survey with nested questions. */
export async function getSurvey(req: Request, res: Response) {
  sendSuccess(
    res,
    await service.getSurvey(Number(String(req.params.id)), userId(req)),
  );
}

/** Creates a survey. */
export async function createSurvey(req: Request, res: Response) {
  sendSuccess(res, await service.createSurvey(userId(req), req.body), 201);
}

/** Updates survey metadata. */
export async function updateSurvey(req: Request, res: Response) {
  sendSuccess(
    res,
    await model.updateSurvey(
      Number(String(req.params.id)),
      userId(req),
      req.body,
    ),
  );
}

/** Deletes a survey. */
export async function deleteSurvey(req: Request, res: Response) {
  await model.deleteSurvey(Number(String(req.params.id)), userId(req));
  sendSuccess(res, { deleted: true });
}

/** Activates a survey. */
export async function activateSurvey(req: Request, res: Response) {
  sendSuccess(
    res,
    await service.activateSurvey(Number(String(req.params.id)), userId(req)),
  );
}

/** Closes a survey. */
export async function closeSurvey(req: Request, res: Response) {
  sendSuccess(
    res,
    await service.closeSurvey(Number(String(req.params.id)), userId(req)),
  );
}

/** Adds a question to a survey. */
export async function addQuestion(req: Request, res: Response) {
  sendSuccess(
    res,
    await service.addQuestion(Number(req.params.surveyId), req.body),
    201,
  );
}

/** Updates a question. */
export async function updateQuestion(req: Request, res: Response) {
  sendSuccess(
    res,
    await model.updateQuestion(Number(String(req.params.id)), req.body),
  );
}

/** Deletes a question. */
export async function deleteQuestion(req: Request, res: Response) {
  await model.deleteQuestion(Number(String(req.params.id)));
  sendSuccess(res, { deleted: true });
}

/** Reorders questions. */
export async function reorderQuestions(req: Request, res: Response) {
  await model.reorderQuestions(
    Number(req.params.surveyId),
    req.body.questionIds,
  );
  sendSuccess(res, { reordered: true });
}

/** Gets public survey data. */
export async function getPublicSurvey(req: Request, res: Response) {
  sendSuccess(res, await service.getPublicSurvey(String(req.params.token)));
}

/** Submits a public survey response. */
export async function submitResponse(req: Request, res: Response) {
  sendSuccess(
    res,
    await service.submitResponse(String(req.params.token), req.ip, req.body),
    201,
  );
}

/** Gets aggregated results. */
export async function getResults(req: Request, res: Response) {
  sendSuccess(
    res,
    await service.getResults(Number(String(req.params.id)), userId(req)),
  );
}

/** Gets raw responses. */
export async function getResponses(req: Request, res: Response) {
  sendSuccess(
    res,
    await model.listResponses(
      Number(String(req.params.id)),
      Number(req.query.limit ?? 50),
      Number(req.query.offset ?? 0),
    ),
  );
}

/** Downloads survey responses as CSV. */
export async function exportResponses(req: Request, res: Response) {
  const csv = await service.exportResponses(
    Number(String(req.params.id)),
    userId(req),
  );
  res
    .header("Content-Type", "text/csv")
    .attachment("survey-responses.csv")
    .send(csv);
}

/** Duplicates a survey. */
export async function duplicateSurvey(req: Request, res: Response) {
  sendSuccess(
    res,
    await service.duplicateSurvey(Number(String(req.params.id)), userId(req)),
    201,
  );
}
