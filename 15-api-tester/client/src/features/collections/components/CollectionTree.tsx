import styles from "../../../App.module.css";
import type { Collection, SavedRequest } from "../../../types";

/** Renders nested collections, folders, and saved requests. */
export function CollectionTree({ collections, onOpen, onExport, onImport }: { collections: Collection[]; onOpen: (request: SavedRequest) => void; onExport: (id: number) => void; onImport: (id: number, file: File) => void }): JSX.Element {
  return (
    <div>
      {collections.map((collection) => (
        <section key={collection.id}>
          <div className={styles.treeItem}>
            <strong>{collection.name}</strong>
            <button className={`${styles.iconButton} ${styles.ghost}`} style={{ marginLeft: 8 }} onClick={() => onExport(collection.id)}>
              Export
            </button>
            <label className={`${styles.iconButton} ${styles.ghost}`} style={{ marginLeft: 8 }}>
              Import
              <input hidden type="file" accept="application/json" onChange={(event) => event.target.files?.[0] && onImport(collection.id, event.target.files[0])} />
            </label>
          </div>
          {collection.requests.map((request) => (
            <button className={`${styles.treeItem} ${styles.request}`} key={request.id} onClick={() => onOpen(request)}>
              <span className={`${styles.method} ${styles[request.method]}`}>{request.method}</span> {request.name}
            </button>
          ))}
          {collection.folders.map((folder) => (
            <div className={styles.folder} key={folder.id}>
              <div className={styles.treeItem}>▾ {folder.name}</div>
              {folder.requests.map((request) => (
                <button className={`${styles.treeItem} ${styles.request}`} key={request.id} onClick={() => onOpen(request)}>
                  <span className={`${styles.method} ${styles[request.method]}`}>{request.method}</span> {request.name}
                </button>
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
