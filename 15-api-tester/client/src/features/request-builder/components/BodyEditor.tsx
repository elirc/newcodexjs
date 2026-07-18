import { CodeEditor } from "../../../components/ui/CodeEditor";
import styles from "../../../App.module.css";
import type { RequestDraft } from "../../../types";

/** Renders body type controls and a CodeMirror editor. */
export function BodyEditor({ bodyType, body, onTypeChange, onBodyChange }: { bodyType: RequestDraft["bodyType"]; body: string; onTypeChange: (type: RequestDraft["bodyType"]) => void; onBodyChange: (body: string) => void }): JSX.Element {
  return (
    <div className={styles.panel}>
      <select className={styles.select} value={bodyType} onChange={(event) => onTypeChange(event.target.value as RequestDraft["bodyType"])}>
        <option value="none">None</option>
        <option value="json">JSON</option>
        <option value="raw">Raw</option>
        <option value="form-data">Form data</option>
      </select>
      {bodyType !== "none" ? <CodeEditor value={body} onChange={onBodyChange} /> : <p className={styles.muted}>No body will be sent.</p>}
    </div>
  );
}
