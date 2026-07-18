import { Router } from "express";
import * as controller from "../controllers/surveyController.js";
import { validateBody } from "../middleware/validate.js";
import { questionSchema, reorderSchema, responseSchema, surveySchema } from "../validators/surveyValidators.js";

export const surveyRouter = Router();

surveyRouter.get("/surveys", controller.listSurveys);
surveyRouter.get("/surveys/:id", controller.getSurvey);
surveyRouter.post("/surveys", validateBody(surveySchema), controller.createSurvey);
surveyRouter.put("/surveys/:id", validateBody(surveySchema.partial()), controller.updateSurvey);
surveyRouter.delete("/surveys/:id", controller.deleteSurvey);
surveyRouter.patch("/surveys/:id/activate", controller.activateSurvey);
surveyRouter.patch("/surveys/:id/close", controller.closeSurvey);
surveyRouter.get("/surveys/:id/results", controller.getResults);
surveyRouter.get("/surveys/:id/responses", controller.getResponses);
surveyRouter.get("/surveys/:id/export", controller.exportResponses);
surveyRouter.post("/surveys/:id/duplicate", controller.duplicateSurvey);
surveyRouter.post("/surveys/:surveyId/questions", validateBody(questionSchema), controller.addQuestion);
surveyRouter.put("/questions/:id", validateBody(questionSchema.partial()), controller.updateQuestion);
surveyRouter.delete("/questions/:id", controller.deleteQuestion);
surveyRouter.put("/surveys/:surveyId/questions/reorder", validateBody(reorderSchema), controller.reorderQuestions);
surveyRouter.get("/public/surveys/:token", controller.getPublicSurvey);
surveyRouter.post("/public/surveys/:token/responses", validateBody(responseSchema), controller.submitResponse);

