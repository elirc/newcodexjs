import { useState } from "react";
import styles from "../../../App.module.css";
import type { RequestDraft } from "../../../types";
import { AuthEditor } from "./AuthEditor";
import { BodyEditor } from "./BodyEditor";
import { KeyValueEditor } from "./KeyValueEditor";

type ConfigTab = "Params" | "Headers" | "Body" | "Auth";

/** Renders request configuration tabs for params, headers, body, and auth. */
export function RequestConfigTabs({ draft, onChange }: { draft: RequestDraft; onChange: (draft: RequestDraft) => void }): JSX.Element {
  const [active, setActive] = useState<ConfigTab>("Params");

  return (
    <>
      <div className={styles.tabs}>
        {(["Params", "Headers", "Body", "Auth"] as ConfigTab[]).map((tab) => (
          <button className={`${styles.tab} ${active === tab ? styles.tabActive : ""}`} key={tab} onClick={() => setActive(tab)}>
            {tab}
          </button>
        ))}
      </div>
      {active === "Params" ? <KeyValueEditor rows={draft.params} onChange={(params) => onChange({ ...draft, params, dirty: true })} /> : null}
      {active === "Headers" ? <KeyValueEditor rows={draft.headers} onChange={(headers) => onChange({ ...draft, headers, dirty: true })} /> : null}
      {active === "Body" ? <BodyEditor bodyType={draft.bodyType} body={draft.body} onTypeChange={(bodyType) => onChange({ ...draft, bodyType, dirty: true })} onBodyChange={(body) => onChange({ ...draft, body, dirty: true })} /> : null}
      {active === "Auth" ? <AuthEditor auth={draft.auth} onChange={(auth) => onChange({ ...draft, auth, dirty: true })} /> : null}
    </>
  );
}
