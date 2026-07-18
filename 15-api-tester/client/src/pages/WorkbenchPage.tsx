import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import styles from "../App.module.css";
import { CollectionTree } from "../features/collections/components/CollectionTree";
import { EnvironmentSelector } from "../features/environments/components/EnvironmentSelector";
import { HistoryPanel } from "../features/history/components/HistoryPanel";
import { RequestConfigTabs } from "../features/request-builder/components/RequestConfigTabs";
import { RequestTabs } from "../features/request-builder/components/RequestTabs";
import { UrlBar } from "../features/request-builder/components/UrlBar";
import { ResponsePanel } from "../features/response-viewer/components/ResponsePanel";
import { activateEnvironment, duplicateRequest, exportCollection, fetchCollections, fetchEnvironments, fetchHistory, importCollection, saveRequest, sendProxyRequest, toDraft, updateRequest } from "../services/api";
import type { ProxyResponse, RequestDraft, SavedRequest } from "../types";
import { interpolate, variableMap } from "../utils/interpolate";

const blankDraft: RequestDraft = {
  name: "Untitled Request",
  method: "GET",
  url: "{{baseUrl}}/posts",
  params: [{ key: "_limit", value: "10", enabled: true }],
  headers: [{ key: "Accept", value: "application/json", enabled: true }],
  bodyType: "none",
  body: "{\n  \"title\": \"Hello\"\n}",
  auth: { type: "none" }
};

/** Renders the full three-panel API testing workbench. */
export function WorkbenchPage(): JSX.Element {
  const queryClient = useQueryClient();
  const [sidebarTab, setSidebarTab] = useState<"Collections" | "History">("Collections");
  const [tabs, setTabs] = useState<RequestDraft[]>([blankDraft]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [response, setResponse] = useState<ProxyResponse>();
  const collections = useQuery({ queryKey: ["collections"], queryFn: fetchCollections });
  const environments = useQuery({ queryKey: ["environments"], queryFn: fetchEnvironments });
  const history = useQuery({ queryKey: ["history"], queryFn: fetchHistory });
  const activeEnvironment = environments.data?.find((environment) => environment.is_active) ?? environments.data?.[0];
  const previewVariables = useMemo(() => variableMap(activeEnvironment?.variables ?? []), [activeEnvironment]);
  const draft = tabs[activeIndex];
  const sendMutation = useMutation({
    mutationFn: () => sendProxyRequest(draft, activeEnvironment?.id),
    onSuccess: (result) => {
      setResponse(result);
      queryClient.invalidateQueries({ queryKey: ["history"] });
    }
  });
  const saveMutation = useMutation({
    mutationFn: () => (draft.id ? updateRequest(draft) : saveRequest(draft, collections.data?.[0]?.id)),
    onSuccess: (saved) => {
      updateDraft(toDraft(saved));
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    }
  });
  const activateMutation = useMutation({
    mutationFn: activateEnvironment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["environments"] })
  });

  /** Replaces the active draft. */
  function updateDraft(next: RequestDraft): void {
    setTabs((current) => current.map((item, index) => (index === activeIndex ? next : item)));
  }

  /** Opens a saved request in a new tab. */
  function openRequest(request: SavedRequest): void {
    setTabs((current) => [...current, toDraft(request)]);
    setActiveIndex(tabs.length);
  }

  /** Exports a collection by downloading JSON from the browser. */
  async function downloadCollection(id: number): Promise<void> {
    const exported = await exportCollection(id);
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${exported.name}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  /** Imports requests from an exported collection JSON file. */
  async function importCollectionFile(id: number, file: File): Promise<void> {
    const text = await file.text();
    const parsed = JSON.parse(text) as { requests?: SavedRequest[]; folders?: Array<{ requests?: SavedRequest[] }> };
    const requests = [...(parsed.requests ?? []), ...(parsed.folders?.flatMap((folder) => folder.requests ?? []) ?? [])];
    await importCollection(id, { requests });
    queryClient.invalidateQueries({ queryKey: ["collections"] });
  }

  /** Duplicates the active saved request and opens the copy. */
  async function duplicateActive(): Promise<void> {
    if (!draft.id) return;
    const copy = await duplicateRequest(draft.id);
    openRequest(copy);
    queryClient.invalidateQueries({ queryKey: ["collections"] });
  }

  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <div className={styles.brand}>Project 15 - REST API Testing Tool</div>
        <EnvironmentSelector environments={environments.data ?? []} activeId={activeEnvironment?.id} onActivate={(id) => activateMutation.mutate(id)} />
      </header>
      <div className={styles.workspace}>
        <aside className={styles.sidebar}>
          <div className={styles.tabs}>
            {(["Collections", "History"] as const).map((tab) => (
              <button className={`${styles.tab} ${sidebarTab === tab ? styles.tabActive : ""}`} key={tab} onClick={() => setSidebarTab(tab)}>
                {tab}
              </button>
            ))}
          </div>
          {sidebarTab === "Collections" ? <CollectionTree collections={collections.data ?? []} onOpen={openRequest} onExport={downloadCollection} onImport={importCollectionFile} /> : <HistoryPanel entries={history.data?.items ?? []} />}
        </aside>
        <main className={styles.builder}>
          <RequestTabs tabs={tabs} activeIndex={activeIndex} onSelect={setActiveIndex} onAdd={() => { setTabs([...tabs, { ...blankDraft, name: `Untitled ${tabs.length + 1}` }]); setActiveIndex(tabs.length); }} />
          <UrlBar method={draft.method} url={draft.url} onMethodChange={(method) => updateDraft({ ...draft, method, dirty: true })} onUrlChange={(url) => updateDraft({ ...draft, url, dirty: true })} onSend={() => sendMutation.mutate()} isSending={sendMutation.isPending} />
          <p className={styles.muted}>Preview: {interpolate(draft.url, previewVariables)}</p>
          <div className={styles.row}>
            <button className={styles.button} onClick={() => saveMutation.mutate()}>{draft.id ? "Update" : "Save"}</button>
            <button className={`${styles.button} ${styles.ghost}`} disabled={!draft.id} onClick={duplicateActive}>Duplicate</button>
          </div>
          <RequestConfigTabs draft={draft} onChange={updateDraft} />
        </main>
        <aside className={styles.response}>
          <ResponsePanel response={response} />
        </aside>
      </div>
    </div>
  );
}
