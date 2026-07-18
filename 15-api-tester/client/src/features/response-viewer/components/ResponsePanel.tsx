import { useMemo, useState } from "react";
import { CodeEditor } from "../../../components/ui/CodeEditor";
import styles from "../../../App.module.css";
import type { ProxyResponse } from "../../../types";

type ResponseTab = "Body" | "Headers" | "Timing";

/** Renders status, body, headers, and timing for the most recent response. */
export function ResponsePanel({ response }: { response?: ProxyResponse }): JSX.Element {
  const [tab, setTab] = useState<ResponseTab>("Body");
  const prettyBody = useMemo(() => {
    if (!response?.body) return "";
    try {
      return JSON.stringify(JSON.parse(response.body), null, 2);
    } catch {
      return response.body;
    }
  }, [response]);

  if (!response) return <section className={styles.panel}>Send a request to see the response.</section>;
  return (
    <section className={styles.panel}>
      <div className={styles.statusBar}>
        <strong>Status {response.status || "ERR"} {response.statusText}</strong>
        <span>{response.timing.totalMs} ms</span>
        <span>{response.sizeBytes} bytes</span>
      </div>
      <div className={styles.tabs}>
        {(["Body", "Headers", "Timing"] as ResponseTab[]).map((item) => (
          <button className={`${styles.tab} ${tab === item ? styles.tabActive : ""}`} key={item} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </div>
      {tab === "Body" ? <CodeEditor readOnly value={prettyBody} /> : null}
      {tab === "Headers" ? <pre className={styles.pre}>{JSON.stringify(response.headers, null, 2)}</pre> : null}
      {tab === "Timing" ? <pre className={styles.pre}>{JSON.stringify(response.timing, null, 2)}</pre> : null}
    </section>
  );
}
