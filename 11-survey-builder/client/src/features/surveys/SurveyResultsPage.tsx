import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import styles from "../../App.module.css";
import { exportUrl, surveyApi } from "../../services/api";
import type { ResultQuestion } from "../../types/survey";

/** Renders aggregated survey results with lightweight CSS charts. */
export function SurveyResultsPage() {
  const surveyId = Number(useParams().id);
  const results = useQuery({ queryKey: ["results", surveyId], queryFn: () => surveyApi.getResults(surveyId) });
  const questions = (results.data as { questions?: ResultQuestion[]; totalResponses?: number } | undefined)?.questions ?? [];

  return (
    <main className={styles.page}>
      <h1>Results</h1>
      <a className={styles.button} href={exportUrl(surveyId)}>
        Export CSV
      </a>
      <p>{(results.data as { totalResponses?: number } | undefined)?.totalResponses ?? 0} total responses</p>
      <section className={styles.grid}>
        {questions.map((item) => (
          <article className={styles.panel} key={item.question.id}>
            <h2>{item.question.title}</h2>
            <p>{item.totalAnswers} answers</p>
            {item.options?.map((option) => {
              const percent = item.totalAnswers ? Math.round((option.count / item.totalAnswers) * 100) : 0;
              return (
                <div key={option.label}>
                  <p>
                    {option.label}: {option.count}
                  </p>
                  <div className={styles.resultBar}>
                    <div className={styles.resultFill} style={{ width: `${Math.max(percent, 8)}%` }}>
                      {percent}%
                    </div>
                  </div>
                </div>
              );
            })}
            {typeof item.average === "number" && <h3>Average rating: {item.average.toFixed(1)}</h3>}
            {item.textAnswers?.slice(0, 8).map((answer) => <p key={answer}>{answer}</p>)}
            {item.matrix &&
              Object.entries(item.matrix).map(([row, columns]) => (
                <p key={row}>
                  <strong>{row}</strong>: {Object.entries(columns).map(([column, count]) => `${column} ${count}`).join(", ")}
                </p>
              ))}
          </article>
        ))}
      </section>
    </main>
  );
}

