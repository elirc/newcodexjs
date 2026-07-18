import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";
import styles from "../../App.module.css";
import { surveyApi } from "../../services/api";
import type { Question } from "../../types/survey";

/** Renders the anonymous respondent experience for a public survey token. */
export function PublicSurveyPage() {
  const token = String(useParams().token);
  const survey = useQuery({ queryKey: ["public-survey", token], queryFn: () => surveyApi.getPublicSurvey(token) });
  const [answers, setAnswers] = useState<Record<number, unknown>>({});
  const submit = useMutation({ mutationFn: () => surveyApi.submitResponse(token, { answers }) });

  if (submit.isSuccess) {
    return (
      <main className={styles.publicWrap}>
        <section className={styles.publicCard}>
          <h1>Thank you</h1>
          <p>Your response was recorded.</p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.publicWrap}>
      <form
        className={styles.publicCard}
        onSubmit={(event) => {
          event.preventDefault();
          submit.mutate();
        }}
      >
        <header>
          <h1>{survey.data?.title}</h1>
          <p>{survey.data?.description}</p>
        </header>
        {survey.data?.questions?.map((question) => (
          <QuestionInput key={question.id} question={question} value={answers[question.id]} onChange={(value) => setAnswers({ ...answers, [question.id]: value })} />
        ))}
        <button className={styles.button}>Submit response</button>
      </form>
    </main>
  );
}

interface QuestionInputProps {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
}

/** Switches between supported respondent input controls by question type. */
function QuestionInput({ question, value, onChange }: QuestionInputProps) {
  const common = <p>{question.is_required ? "Required" : "Optional"}</p>;
  if (question.question_type === "long_text") {
    return (
      <label>
        <strong>{question.title}</strong>
        {common}
        <textarea className={styles.textarea} required={question.is_required} onChange={(event) => onChange(event.target.value)} />
      </label>
    );
  }
  if (question.question_type === "single_choice" || question.question_type === "yes_no") {
    const options = question.question_type === "yes_no" ? ["Yes", "No"] : question.options.map((option) => option.label);
    return (
      <fieldset>
        <legend>{question.title}</legend>
        {options.map((option) => (
          <label className={styles.row} key={option}>
            <input type="radio" name={`q-${question.id}`} required={question.is_required} onChange={() => onChange(option)} />
            {option}
          </label>
        ))}
      </fieldset>
    );
  }
  if (question.question_type === "multi_choice") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <fieldset>
        <legend>{question.title}</legend>
        {question.options.map((option) => (
          <label className={styles.row} key={option.id}>
            <input
              type="checkbox"
              onChange={(event) =>
                onChange(event.target.checked ? [...selected, option.label] : selected.filter((item) => item !== option.label))
              }
            />
            {option.label}
          </label>
        ))}
      </fieldset>
    );
  }
  if (question.question_type === "rating") {
    const max = Number(question.config?.max ?? 5);
    return (
      <label>
        <strong>{question.title}</strong>
        <select className={styles.select} required={question.is_required} onChange={(event) => onChange(Number(event.target.value))}>
          <option value="">Choose</option>
          {Array.from({ length: max }, (_, index) => index + 1).map((rating) => (
            <option key={rating} value={rating}>
              {rating}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (question.question_type === "matrix") {
    const rows = (question.config?.rows as string[] | undefined) ?? [];
    const columns = (question.config?.columns as string[] | undefined) ?? [];
    const matrixValue = (value as Record<string, string> | undefined) ?? {};
    return (
      <fieldset>
        <legend>{question.title}</legend>
        {rows.map((row) => (
          <div key={row}>
            <strong>{row}</strong>
            {columns.map((column) => (
              <label className={styles.row} key={column}>
                <input type="radio" name={`${question.id}-${row}`} onChange={() => onChange({ ...matrixValue, [row]: column })} />
                {column}
              </label>
            ))}
          </div>
        ))}
      </fieldset>
    );
  }
  return (
    <label>
      <strong>{question.title}</strong>
      {common}
      <input
        className={styles.field}
        type={question.question_type === "date" ? "date" : question.question_type === "number" ? "number" : "text"}
        required={question.is_required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

