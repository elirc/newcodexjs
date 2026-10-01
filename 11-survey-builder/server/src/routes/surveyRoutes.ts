import type { RequestHandler } from "express";
import { Router } from "express";
import * as controller from "../controllers/surveyController.js";
import { validateBody } from "../middleware/validate.js";
import {
  questionSchema,
  reorderSchema,
  responseSchema,
  surveySchema,
} from "../validators/surveyValidators.js";

export const surveyRouter = Router();

surveyRouter.get("/surveys", wrap(controller.listSurveys));
surveyRouter.get("/surveys/:id", wrap(controller.getSurvey));
surveyRouter.post(
  "/surveys",
  validateBody(surveySchema),
  wrap(controller.createSurvey),
);
surveyRouter.put(
  "/surveys/:id",
  validateBody(surveySchema.partial()),
  wrap(controller.updateSurvey),
);
surveyRouter.delete("/surveys/:id", wrap(controller.deleteSurvey));
surveyRouter.patch("/surveys/:id/activate", wrap(controller.activateSurvey));
surveyRouter.patch("/surveys/:id/close", wrap(controller.closeSurvey));
surveyRouter.get("/surveys/:id/results", wrap(controller.getResults));
surveyRouter.get("/surveys/:id/responses", wrap(controller.getResponses));
surveyRouter.get("/surveys/:id/export", wrap(controller.exportResponses));
surveyRouter.post("/surveys/:id/duplicate", wrap(controller.duplicateSurvey));
surveyRouter.post(
  "/surveys/:surveyId/questions",
  validateBody(questionSchema),
  wrap(controller.addQuestion),
);
surveyRouter.put(
  "/questions/:id",
  validateBody(questionSchema.partial()),
  wrap(controller.updateQuestion),
);
surveyRouter.delete("/questions/:id", wrap(controller.deleteQuestion));
surveyRouter.put(
  "/surveys/:surveyId/questions/reorder",
  validateBody(reorderSchema),
  wrap(controller.reorderQuestions),
);
surveyRouter.get("/public/surveys/:token", wrap(controller.getPublicSurvey));
surveyRouter.post(
  "/public/surveys/:token/responses",
  validateBody(responseSchema),
  wrap(controller.submitResponse),
);

function wrap(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
