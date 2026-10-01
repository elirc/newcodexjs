import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import App from "./App";
import * as api from "./services/api";

vi.mock("./services/api", () => ({
  listRecords: vi.fn(),
  loadStats: vi.fn(),
  createRecord: vi.fn(),
  updateRecord: vi.fn(),
  deleteRecord: vi.fn(),
}));

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void };
function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}
const record = (id: number, title: string) => ({
  id,
  title,
  body: "",
  slug: title.toLowerCase(),
  status: "draft",
  tags: [],
  created_at: "",
  updated_at: "",
});

beforeEach(() => {
  cleanup();
  vi.mocked(api.loadStats).mockResolvedValue({ total: 0, byStatus: [] });
  vi.mocked(api.listRecords).mockReset();
  vi.mocked(api.createRecord).mockReset();
});

describe("App guards", () => {
  test("a slow, older search response does not overwrite a newer one", async () => {
    const first = deferred<ReturnType<typeof record>[]>();
    const second = deferred<ReturnType<typeof record>[]>();
    vi.mocked(api.listRecords)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    render(<App />);
    // Initial refresh (debounced 150 ms) issues request #1 for search "".
    await waitFor(() => expect(api.listRecords).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByLabelText("Search records"), { target: { value: "b" } });
    // The search effect cleanup bumps the sequence, then request #2 fires after the debounce.
    await waitFor(() => expect(api.listRecords).toHaveBeenCalledTimes(2));
    second.resolve([record(2, "Newer")]);
    await screen.findByText("Newer");
    first.resolve([record(1, "Older")]);
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText("Older")).toBeNull();
    expect(screen.getByText("Newer")).toBeTruthy();
  });

  test("a double submit issues exactly one create request", async () => {
    vi.mocked(api.listRecords).mockResolvedValue([]);
    const pending = deferred<ReturnType<typeof record>>();
    vi.mocked(api.createRecord).mockReturnValue(pending.promise);
    render(<App />);
    await waitFor(() => expect(api.listRecords).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText("title"), { target: { value: "Hello" } });
    fireEvent.change(screen.getByLabelText("slug"), { target: { value: "hello" } });
    fireEvent.change(screen.getByLabelText("status"), { target: { value: "draft" } });
    const button = screen.getByRole("button", { name: "Create" });
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.submit(button.closest("form")!);
    expect(api.createRecord).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Saving…" })).toBeTruthy();
    pending.resolve(record(3, "Hello"));
    await screen.findByText("Record saved.");
  });
});
