import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RunSummary, Steps } from "@/lib/types/domain";
import type { RunEvents } from "@/lib/types/runEvents";

const resolveIdentity = vi.fn();
const retryStep = vi.fn();

vi.mock("@/app/actions/runs", () => ({
  resolveIdentity: (input: unknown) => resolveIdentity(input),
  retryStep: (input: unknown) => retryStep(input),
}));

const { ProgressStrip } = await import("./ProgressStrip");
const { IdentityResolver } = await import("./IdentityResolver");
const { StepErrorBanner } = await import("./StepErrorBanner");
const { currentStepNumber } = await import("./RunArea");
const { ReviewBar } = await import("@/components/shell/ReviewBar");
const { NoticeProvider } = await import("@/components/ui/Notice");
const { initialScreenState, ScreenContext } = await import("@/components/shell/screenState");

const RUN_ID = "RUN-2026-0919-0412";

const run: RunSummary = {
  runId: RUN_ID,
  kind: "single",
  title: "Polysorbate 80 × 1N8Z Fab",
  route: "SC",
  context: null,
  createdAt: "2026-09-19T04:12:00.000Z",
  review: { status: "draft", version: 1 },
};

const midHazard: Steps = {
  identity: { status: "done", note: "Polysorbate 80 · CAS 9005-65-6" },
  precedent: { status: "done", note: "6 sources" },
  hazard: { status: "active", note: "Running…" },
  liability: { status: "pending", note: "Waiting" },
};

function events(overrides: Partial<RunEvents>): RunEvents {
  return {
    runId: RUN_ID,
    runState: "running",
    steps: midHazard,
    settled: false,
    query: "Polysorbate 80",
    ...overrides,
  };
}

const CANDIDATES = [
  { id: "ps80", name: "Polysorbate 80", cas: "9005-65-6", basis: "Name similarity 0.82" },
  {
    id: "ps80-hp",
    name: "Polysorbate 80, high-purity grade",
    cas: "9005-65-6",
    basis: "Grade-level record",
  },
];

/** Renders `ui` with a loaded run. Notices only where a test reads them: they add an alert region. */
function withScreen(
  ui: ReactNode,
  runEvents: RunEvents | null,
  dispatch = vi.fn(),
  { notices = false } = {},
) {
  const state = { ...initialScreenState, header: { kind: "run" as const, run }, events: runEvents };
  return render(
    <ScreenContext.Provider value={{ state, dispatch }}>
      {notices ? <NoticeProvider>{ui}</NoticeProvider> : ui}
    </ScreenContext.Provider>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe("ProgressStrip", () => {
  it("shows every step as waiting before a run", () => {
    render(<ProgressStrip steps={null} />);
    const items = within(screen.getByRole("list", { name: "Run progress" })).getAllByRole(
      "listitem",
    );
    expect(items).toHaveLength(4);
    for (const item of items) expect(item).toHaveTextContent("Waiting");
  });

  it("gives each status text, not just colour, and announces changes", () => {
    render(
      <ProgressStrip
        steps={{
          ...midHazard,
          identity: { status: "needs_input", note: "Needs your input" },
          hazard: { status: "error", note: "Failed · HTTP 504" },
        }}
      />,
    );
    const list = screen.getByRole("list", { name: "Run progress" });
    expect(list).toHaveAttribute("aria-live", "polite");
    const [identity, precedent, hazard, liability] = within(list).getAllByRole("listitem");
    expect(identity).toHaveTextContent("1. IdentityNeeds your input");
    // A done note isn't a status, so the status is read out before it.
    expect(precedent).toHaveTextContent("Done: 6 sources");
    expect(hazard).toHaveTextContent("Failed: Failed · HTTP 504");
    expect(liability).toHaveTextContent("Waiting");
  });
});

describe("currentStepNumber", () => {
  it("is the active or paused step, else the last", () => {
    expect(currentStepNumber(midHazard)).toBe(3);
    expect(
      currentStepNumber({
        ...midHazard,
        identity: { status: "needs_input" },
        hazard: { status: "pending" },
      }),
    ).toBe(1);
    expect(
      currentStepNumber({
        identity: { status: "done" },
        precedent: { status: "done" },
        hazard: { status: "done" },
        liability: { status: "done" },
      }),
    ).toBe(4);
  });
});

describe("IdentityResolver", () => {
  it("resumes with the picked candidate", async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn();
    const resumed = events({ runState: "running" });
    resolveIdentity.mockResolvedValue({ ok: true, data: resumed });
    withScreen(
      <IdentityResolver runId={RUN_ID} query="Tween 80 HP-K" candidates={CANDIDATES} />,
      null,
      dispatch,
    );
    expect(screen.getByRole("radio", { name: /^Polysorbate 80 CAS/ })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: /high-purity grade/ }));
    await user.click(screen.getByRole("button", { name: "Use and continue" }));
    expect(resolveIdentity).toHaveBeenCalledWith({
      runId: RUN_ID,
      choice: { kind: "candidate", candidateId: "ps80-hp" },
    });
    expect(dispatch).toHaveBeenCalledWith({ type: "runResumed", events: resumed });
  });

  it("uses a typed override instead of the candidate, and checks its format first", async () => {
    const user = userEvent.setup();
    resolveIdentity.mockResolvedValue({ ok: true, data: events({}) });
    withScreen(
      <IdentityResolver runId={RUN_ID} query="Tween 80 HP-K" candidates={CANDIDATES} />,
      null,
    );
    const override = screen.getByRole("textbox", { name: "Manual override (CAS or SMILES)" });
    await user.type(override, "9005-65-7");
    expect(screen.getByRole("radio", { name: /^Polysorbate 80 CAS/ })).not.toBeChecked();
    await user.click(screen.getByRole("button", { name: "Use and continue" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a CAS number");
    expect(resolveIdentity).not.toHaveBeenCalled();

    await user.clear(override);
    await user.type(override, "9005-65-6");
    await user.click(screen.getByRole("button", { name: "Use and continue" }));
    expect(resolveIdentity).toHaveBeenCalledWith({
      runId: RUN_ID,
      choice: { kind: "override", value: "9005-65-6" },
    });
  });

  it("offers only the override when there are no candidates, and shows server errors", async () => {
    const user = userEvent.setup();
    resolveIdentity.mockResolvedValue({
      ok: false,
      error: { code: "invalid_input", message: "This run isn't waiting for that anymore." },
    });
    withScreen(<IdentityResolver runId={RUN_ID} query="Unknownium" candidates={[]} />, null);
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Use and continue" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a candidate or enter an override.");
    await user.type(screen.getByRole("textbox"), "CCO");
    await user.click(screen.getByRole("button", { name: "Use and continue" }));
    expect(await screen.findByText("This run isn't waiting for that anymore.")).toBeInTheDocument();
  });
});

describe("StepErrorBanner", () => {
  it("shows the reason and retries only the failed step", async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn();
    const resumed = events({});
    retryStep.mockResolvedValue({ ok: true, data: resumed });
    const failure = {
      step: "hazard" as const,
      reason: "PubChem hazard lookup timed out",
      detail: "HTTP 504, 3 attempts",
    };
    withScreen(<StepErrorBanner runId={RUN_ID} failure={failure} />, null, dispatch);
    const banner = screen.getByRole("alert");
    expect(banner).toHaveTextContent("Hazard step failed");
    expect(banner).toHaveTextContent("PubChem hazard lookup timed out (HTTP 504, 3 attempts)");
    await user.click(screen.getByRole("button", { name: "Retry hazard step" }));
    expect(retryStep).toHaveBeenCalledWith({ runId: RUN_ID, step: "hazard" });
    expect(dispatch).toHaveBeenCalledWith({ type: "runResumed", events: resumed });
  });
});

describe("ReviewBar gating", () => {
  const exportPdf = () => screen.getByRole("button", { name: "Export PDF" });
  const signOff = () => screen.getByRole("button", { name: "Sign off" });

  it("keeps everything disabled while running", () => {
    withScreen(<ReviewBar />, events({}));
    expect(signOff()).toBeDisabled();
    expect(exportPdf()).toBeDisabled();
  });

  it("allows exports but not sign-off on partial results after a failure", () => {
    withScreen(<ReviewBar />, events({ runState: "error", settled: true }));
    expect(signOff()).toBeDisabled();
    expect(exportPdf()).toBeEnabled();
  });

  it("enables sign-off only when complete, as a visible stub", async () => {
    const user = userEvent.setup();
    withScreen(<ReviewBar />, events({ runState: "complete", settled: true }), vi.fn(), {
      notices: true,
    });
    expect(signOff()).toBeEnabled();
    await user.click(signOff());
    expect(await screen.findByText("Not connected yet")).toBeInTheDocument();
  });

  it("keeps sign-off disabled while paused for identity", () => {
    withScreen(<ReviewBar />, events({ runState: "identity_unresolved", settled: true }));
    expect(signOff()).toBeDisabled();
    expect(exportPdf()).toBeDisabled();
  });
});
