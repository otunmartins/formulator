import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReducer, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ENDPOINT_SETS } from "@/lib/mocks/endpoints";
import type { RunSummary } from "@/lib/types/domain";
import type { Dossier } from "@/lib/types/dossier";
import type { RunEvents } from "@/lib/types/runEvents";
import { applyNovelRule } from "@/lib/utils/dossier";

const { VerdictMatrix } = await import("./VerdictMatrix");
const { NovelBanner } = await import("./NovelBanner");
const { DossierSection } = await import("./DossierSection");
const { initialScreenState, ScreenContext, screenReducer } =
  await import("@/components/shell/screenState");

const RUN_ID = "RUN-2026-0919-0412";

function dossier(overrides: Partial<Dossier> = {}): Dossier {
  return {
    runId: RUN_ID,
    novelForRoute: false,
    excipient: "Polysorbate 80",
    route: "SC",
    partial: false,
    hasFixture: true,
    endpoints: [...ENDPOINT_SETS.ps80.endpoints],
    ...overrides,
  };
}

const alx = (): Dossier =>
  dossier({
    novelForRoute: true,
    excipient: "ALX-117",
    endpoints: applyNovelRule(ENDPOINT_SETS.alx117.endpoints, true),
  });

/** The matrix with real expand/collapse state. */
function Matrix({ value, note }: { value: Dossier; note?: string }) {
  const [state, dispatch] = useReducer(screenReducer, initialScreenState);
  return (
    <VerdictMatrix
      dossier={value}
      {...(note ? { note } : {})}
      expandedIds={state.selectedEndpointIds}
      onToggle={(id) => dispatch({ type: "toggleEndpoint", id })}
    />
  );
}

const rowFor = (name: string) => screen.getByRole("rowheader", { name: new RegExp(name) });

describe("VerdictMatrix", () => {
  it("S07: counts each verdict on its own and shows no overall score", () => {
    render(<Matrix value={dossier()} />);
    expect(screen.getByText("No overall score · each endpoint stands alone")).toBeInTheDocument();
    const counts = within(screen.getByRole("list", { name: "Endpoints per verdict" }));
    expect(counts.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "3 Precedented",
      "2 Supported without precedent",
      "2 Data gap: test",
      "1 Alert: avoid",
    ]);
    expect(screen.queryByText(/score:/i)).not.toBeInTheDocument();
  });

  it("gives every row a verdict in words with an icon, a grade and a basis", () => {
    render(<Matrix value={dossier()} />);
    const rows = screen.getAllByRole("rowheader");
    expect(rows).toHaveLength(8);
    const perox = rowFor("Peroxide impurities").closest("tr");
    if (!perox) throw new Error("no row");
    const chip = within(perox).getByText("Alert: avoid");
    expect(chip.parentElement?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(within(perox).getByRole("button", { name: "Evidence grade B" })).toBeInTheDocument();
    expect(perox).toHaveTextContent("HC Met107 in CDR-H3 is solvent-exposed");
    expect(document.body.textContent).not.toMatch(/\bsafe\b/i);
  });

  it("flags grade D rows as out of domain", () => {
    render(<Matrix value={dossier()} />);
    const hydrolysis = rowFor("Hydrolysis").closest("tr");
    if (!hydrolysis) throw new Error("no row");
    expect(hydrolysis).toHaveTextContent(
      "Out of domain: this prediction uses polysorbate 20 data as a surrogate.",
    );
    const regulatory = rowFor("Regulatory precedent").closest("tr");
    expect(regulatory).not.toHaveTextContent("Out of domain");
  });

  it("starts collapsed and expands a row's sources from the keyboard", async () => {
    const user = userEvent.setup();
    render(<Matrix value={dossier()} />);
    const toggle = screen.getByRole("button", { name: /Sources for Peroxide impurities/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    const panel = document.getElementById(toggle.getAttribute("aria-controls") ?? "");
    expect(panel).not.toBeVisible();

    toggle.focus();
    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(panel).toBeVisible();
    expect(panel).toHaveTextContent("Sources (3)");
    expect(panel).toHaveTextContent("Ha, Wang & Wang. Peroxide formation in polysorbate 80");
    expect(panel).toHaveTextContent("1N8Z · FreeSASA 2.1");

    // Several rows can be open at once.
    await user.click(screen.getByRole("button", { name: /Sources for Hypersensitivity/ }));
    expect(
      screen.getAllByText(/^Sources \(/).filter((el) => el.closest("tr:not([hidden])")),
    ).toHaveLength(2);

    await user.keyboard(" ");
    expect(screen.getByRole("button", { name: /Sources for Hypersensitivity/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("marks a source that isn't in the fixtures as a placeholder", async () => {
    const user = userEvent.setup();
    render(<Matrix value={dossier()} />);
    const toggle = screen.getByRole("button", { name: /Sources for Regulatory precedent/ });
    await user.click(toggle);
    const panel = document.getElementById(toggle.getAttribute("aria-controls") ?? "");
    expect(panel).toHaveTextContent("Sources (1)");
    expect(panel).toHaveTextContent("[PLACEHOLDER]");
  });

  it("shows the A–E legend when a grade badge gets keyboard focus", async () => {
    const user = userEvent.setup();
    render(<Matrix value={dossier()} />);
    await user.tab(); // first row's chevron
    await user.tab(); // its grade badge
    expect(document.activeElement).toHaveAccessibleName("Evidence grade A");
    const legend = screen.getAllByRole("tooltip").find((t) => !t.hidden);
    expect(legend).toHaveTextContent("Regulatory precedent at this route and level");
    expect(legend).toHaveTextContent("Out-of-domain or surrogate prediction");
  });

  it("S15: every endpoint is a data gap with zero positive counts", () => {
    render(<Matrix value={alx()} />);
    const counts = within(screen.getByRole("list", { name: "Endpoints per verdict" }));
    expect(counts.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "0 Precedented",
      "0 Supported without precedent",
      "8 Data gap: test",
      "0 Alert: avoid",
    ]);
    const table = screen.getByRole("table");
    expect(within(table).queryByText("Precedented")).not.toBeInTheDocument();
    expect(within(table).queryByText("Supported without precedent")).not.toBeInTheDocument();
    expect(within(table).getAllByText("Data gap: test")).toHaveLength(8);
  });

  it("shows a visible placeholder row when no endpoint fixture exists", () => {
    render(<Matrix value={dossier({ hasFixture: false, endpoints: [] })} />);
    expect(
      screen.getByText("No endpoint fixture for this excipient [PLACEHOLDER]"),
    ).toBeInTheDocument();
  });

  it("partial mode shows only the endpoints present, under the S06 header line", () => {
    const precedentOnly = ENDPOINT_SETS.ps80.endpoints.filter((e) => e.step === "precedent");
    render(
      <Matrix
        value={dossier({ partial: true, endpoints: precedentOnly })}
        note="Precedent endpoints only · hazard step failed"
      />,
    );
    expect(screen.getByText("Precedent endpoints only · hazard step failed")).toBeInTheDocument();
    expect(screen.getAllByRole("rowheader")).toHaveLength(3);
  });
});

describe("NovelBanner", () => {
  it("S15: names the excipient and route", () => {
    render(<NovelBanner excipient="ALX-117" route="SC" />);
    expect(screen.getByRole("region", { name: "Needs a nonclinical package" })).toHaveTextContent(
      "ALX-117 has no precedent for the SC route. No positive verdict is given for any endpoint until nonclinical data are added to this dossier.",
    );
  });
});

describe("DossierSection", () => {
  const run: RunSummary = {
    runId: RUN_ID,
    kind: "single",
    title: "ALX-117 × 1N8Z Fab",
    route: "SC",
    context: null,
    createdAt: "2026-09-19T04:12:00.000Z",
    review: { status: "draft", version: 1 },
  };
  const complete: RunEvents = {
    runId: RUN_ID,
    runState: "complete",
    steps: {
      identity: { status: "done" },
      precedent: { status: "done" },
      hazard: { status: "done" },
      liability: { status: "done" },
    },
    settled: true,
    query: "ALX-117",
  };

  function Harness({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(screenReducer, {
      ...initialScreenState,
      header: { kind: "run", run },
      events: complete,
    });
    return <ScreenContext.Provider value={{ state, dispatch }}>{children}</ScreenContext.Provider>;
  }

  afterEach(() => vi.unstubAllGlobals());

  it("fetches the dossier once the run is complete and shows the novel banner", async () => {
    const fetchMock = vi.fn(async () => Response.json(alx()));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <Harness>
        <DossierSection />
      </Harness>,
    );
    expect(screen.getByText(/Filling in as steps complete/)).toBeInTheDocument();
    expect(
      await screen.findByRole("region", { name: "Needs a nonclinical package" }),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(`/api/runs/${RUN_ID}/dossier`, { cache: "no-store" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows a load error with a retry, keeping nothing half-drawn", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(Response.json(dossier()));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <Harness>
        <DossierSection />
      </Harness>,
    );
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("The verdict matrix couldn't be loaded.");
    await user.click(within(alert).getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getAllByRole("rowheader")).toHaveLength(8));
  });
});
