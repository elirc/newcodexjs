import axios from "axios";
import type { Question, Survey } from "../types/survey";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4111/api",
  headers: { "x-demo-user-id": "1" }
});

/** Unwraps the shared API response envelope. */
function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export const surveyApi = {
  /** Lists surveys for the demo user. */
  listSurveys: async () => unwrap<Survey[]>(await api.get("/surveys")),
  /** Loads one survey with questions and options. */
  getSurvey: async (id: number) => unwrap<Survey>(await api.get(`/surveys/${id}`)),
  /** Creates a survey shell. */
  createSurvey: async (payload: Partial<Survey>) => unwrap<Survey>(await api.post("/surveys", payload)),
  /** Updates survey metadata. */
  updateSurvey: async (id: number, payload: Partial<Survey>) => unwrap<Survey>(await api.put(`/surveys/${id}`, payload)),
  /** Activates a survey and returns a public token. */
  activateSurvey: async (id: number) => unwrap<Survey>(await api.patch(`/surveys/${id}/activate`)),
  /** Closes an active survey. */
  closeSurvey: async (id: number) => unwrap<Survey>(await api.patch(`/surveys/${id}/close`)),
  /** Adds a question to a survey. */
  addQuestion: async (surveyId: number, payload: Partial<Question>) =>
    unwrap<Question>(await api.post(`/surveys/${surveyId}/questions`, payload)),
  /** Updates a question and its options. */
  updateQuestion: async (id: number, payload: Partial<Question>) => unwrap<Question>(await api.put(`/questions/${id}`, payload)),
  /** Removes a question. */
  deleteQuestion: async (id: number) => unwrap<{ deleted: boolean }>(await api.delete(`/questions/${id}`)),
  /** Reorders survey questions. */
  reorderQuestions: async (surveyId: number, questionIds: number[]) =>
    unwrap<{ reordered: boolean }>(await api.put(`/surveys/${surveyId}/questions/reorder`, { questionIds })),
  /** Gets aggregated results for a survey. */
  getResults: async (id: number) => unwrap(await api.get(`/surveys/${id}/results`)),
  /** Loads a public survey by token. */
  getPublicSurvey: async (token: string) => unwrap<Survey>(await api.get(`/public/surveys/${token}`)),
  /** Submits respondent answers. */
  submitResponse: async (token: string, payload: unknown) => unwrap(await api.post(`/public/surveys/${token}/responses`, payload))
};

export const exportUrl = (surveyId: number) =>
  `${api.defaults.baseURL}/surveys/${surveyId}/export`;

