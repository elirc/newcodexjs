import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import styles from "../../App.module.css";
import { surveyApi } from "../../services/api";
import type { Question, QuestionType } from "../../types/survey";

const questionTypes: QuestionType[] = [
  "short_text",
  "long_text",
  "single_choice",
  "multi_choice",
  "rating",
  "yes_no",
  "number",
  "date",
  "matrix"
];

/** Provides a no-library question builder with reorder controls and option editing. */
export function SurveyBuilderPage() {
  const surveyId = Number(useParams().id);
  const queryClient = useQueryClient();
  const survey = useQuery({ queryKey: ["survey", surveyId], queryFn: () => surveyApi.getSurvey(surveyId) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["survey", surveyId] });
  const addQuestion = useMutation({ mutationFn: (payload: Partial<Question>) => surveyApi.addQuestion(surveyId, payload), onSuccess: refresh });
  const updateQuestion = useMutation({ mutationFn: (payload: Question) => surveyApi.updateQuestion(payload.id, payload), onSuccess: refresh });
  const deleteQuestion = useMutation({ mutationFn: surveyApi.deleteQuestion, onSuccess: refresh });
  const activate = useMutation({ mutationFn: () => surveyApi.activateSurvey(surveyId), onSuccess: refresh });
  const close = useMutation({ mutationFn: () => surveyApi.closeSurvey(surveyId), onSuccess: refresh });
  const reorder = useMutation({ mutationFn: (ids: number[]) => surveyApi.reorderQuestions(surveyId, ids), onSuccess: refresh });

  /** Adds a default question of the selected type. */
  function handleAdd(formData: FormData) {
    const type = String(formData.get("question_type")) as QuestionType;
    addQuestion.mutate({
      question_type: type,
      title: "New question",
      is_required: false,
      config: type === "rating" ? { min: 1, max: 5 } : type === "matrix" ? { rows: ["Quality"], columns: ["Poor", "Good"] } : null,
      options: type.includes("choice")
        ? [
            { id: 0, question_id: 0, label: "Option A", sort_order: 1 },
            { id: 0, question_id: 0, label: "Option B", sort_order: 2 }
          ]
        : []
    });
  }

  /** Moves a question by swapping its id in the ordered list. */
  function moveQuestion(questionId: number, direction: -1 | 1) {
    const ids = (survey.data?.questions ?? []).map((question) => question.id);
    const index = ids.indexOf(questionId);
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= ids.length) return;
    [ids[index], ids[nextIndex]] = [ids[nextIndex], ids[index]];
    reorder.mutate(ids);
  }

  return (
    <main className={styles.page}>
      <h1>{survey.data?.title ?? "Survey builder"}</h1>
      <div className={styles.builder}>
        <section>
          {survey.data?.questions?.map((question) => (
            <QuestionEditor
              key={question.id}
              question={question}
              onChange={(next) => updateQuestion.mutate(next)}
              onDelete={() => deleteQuestion.mutate(question.id)}
              onMove={moveQuestion}
            />
          ))}
        </section>
        <aside className={styles.panel}>
          <h2>Add question</h2>
          <form
            className={styles.grid}
            onSubmit={(event) => {
              event.preventDefault();
              handleAdd(new FormData(event.currentTarget));
            }}
          >
            <select className={styles.select} name="question_type">
              {questionTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace("_", " ")}
                </option>
              ))}
            </select>
            <button className={styles.button}>Add</button>
          </form>
          <h2>Status</h2>
          <p>
            <span className={`${styles.badge} ${styles[survey.data?.status ?? "draft"]}`}>{survey.data?.status}</span>
          </p>
          <div className={styles.actions}>
            <button className={styles.button} onClick={() => activate.mutate()}>
              Activate
            </button>
            <button className={styles.danger} onClick={() => close.mutate()}>
              Close
            </button>
          </div>
          {survey.data?.public_token && <p>Public token: {survey.data.public_token}</p>}
        </aside>
      </div>
    </main>
  );
}

interface QuestionEditorProps {
  question: Question;
  onChange: (question: Question) => void;
  onDelete: () => void;
  onMove: (questionId: number, direction: -1 | 1) => void;
}

/** Edits one question and converts newline options into option records. */
function QuestionEditor({ question, onChange, onDelete, onMove }: QuestionEditorProps) {
  return (
    <article className={styles.question}>
      <div className={styles.questionHeader}>
        <strong>{question.question_type.replace("_", " ")}</strong>
        <div className={styles.actions}>
          <button className={styles.secondary} onClick={() => onMove(question.id, -1)}>
            Up
          </button>
          <button className={styles.secondary} onClick={() => onMove(question.id, 1)}>
            Down
          </button>
          <button className={styles.danger} onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
      <label>
        Title
        <input className={styles.field} value={question.title} onChange={(event) => onChange({ ...question, title: event.target.value })} />
      </label>
      <label className={styles.row}>
        <input
          type="checkbox"
          checked={question.is_required}
          onChange={(event) => onChange({ ...question, is_required: event.target.checked })}
        />
        Required
      </label>
      {question.question_type.includes("choice") && (
        <label>
          Options
          <textarea
            className={styles.textarea}
            value={question.options.map((option) => option.label).join("\n")}
            onChange={(event) =>
              onChange({
                ...question,
                options: event.target.value.split("\n").map((label, index) => ({
                  id: question.options[index]?.id ?? 0,
                  question_id: question.id,
                  label,
                  sort_order: index + 1
                }))
              })
            }
          />
        </label>
      )}
    </article>
  );
}
