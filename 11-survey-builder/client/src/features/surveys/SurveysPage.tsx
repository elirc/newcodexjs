import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import styles from "../../App.module.css";
import { surveyApi } from "../../services/api";

/** Shows the survey list and a compact create form. */
export function SurveysPage() {
  const queryClient = useQueryClient();
  const surveys = useQuery({ queryKey: ["surveys"], queryFn: surveyApi.listSurveys });
  const createSurvey = useMutation({
    mutationFn: surveyApi.createSurvey,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["surveys"] })
  });

  /** Handles a simple inline survey create action. */
  function handleCreate(formData: FormData) {
    createSurvey.mutate({
      title: String(formData.get("title") ?? "Untitled survey"),
      description: String(formData.get("description") ?? ""),
      max_responses: Number(formData.get("max_responses") || 100)
    });
  }

  return (
    <main className={styles.page}>
      <h1>Survey Builder</h1>
      <form
        className={styles.toolbar}
        onSubmit={(event) => {
          event.preventDefault();
          handleCreate(new FormData(event.currentTarget));
          event.currentTarget.reset();
        }}
      >
        <input className={styles.field} name="title" placeholder="Customer onboarding feedback" required />
        <input className={styles.field} name="description" placeholder="Description" />
        <button className={styles.button}>Create</button>
      </form>

      <section className={styles.grid}>
        {surveys.data?.map((survey) => (
          <article className={styles.surveyCard} key={survey.id}>
            <div>
              <span className={`${styles.badge} ${styles[survey.status]}`}>{survey.status}</span>
              <h2>{survey.title}</h2>
              <p>{survey.description || "No description yet."}</p>
              <small>{survey.response_count} responses</small>
            </div>
            <div className={styles.actions}>
              <Link className={styles.secondary} to={`/surveys/${survey.id}/builder`}>
                Builder
              </Link>
              <Link className={styles.secondary} to={`/surveys/${survey.id}/results`}>
                Results
              </Link>
              {survey.public_token && (
                <Link className={styles.button} to={`/public/${survey.public_token}`}>
                  Public form
                </Link>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
