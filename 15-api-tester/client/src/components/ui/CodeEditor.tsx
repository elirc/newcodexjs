import { json } from "@codemirror/lang-json";
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { useEffect, useRef } from "react";
import styles from "../../App.module.css";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

/** Mounts CodeMirror for JSON request bodies and response views. */
export function CodeEditor({ value, onChange, readOnly = false }: CodeEditorProps): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          json(),
          oneDark,
          EditorView.editable.of(!readOnly),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChange?.(update.state.doc.toString());
          })
        ]
      })
    });
    viewRef.current = view;
    return () => view.destroy();
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    }
  }, [value]);

  return <div className={styles.editor} ref={hostRef} />;
}
