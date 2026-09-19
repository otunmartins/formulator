import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ShellData } from "@/components/shell/types";

const startRun = vi.fn();
const loadExample = vi.fn();
const lookupIdentity = vi.fn();
const lookupStructure = vi.fn();

vi.mock("@/app/actions/runs", () => ({
  startRun: (input: unknown) => startRun(input),
  loadExample: () => loadExample(),
  openRun: vi.fn(),
}));
vi.mock("@/app/actions/inputs", () => ({
  lookupIdentity: (input: unknown) => lookupIdentity(input),
  lookupStructure: (input: unknown) => lookupStructure(input),
}));
vi.mock("@/app/actions/workspace", () => ({ switchWorkspace: vi.fn() }));

const { Screen } = await import("@/components/shell/Screen");
const { InputPanel } = await import("@/components/shell/InputPanel");
const { RunInputProvider } = await import("./RunInputProvider");
const { initialScreenState, ScreenContext } = await import("@/components/shell/screenState");

const data: ShellData = {
  user: { id: "usr_motun", name: "M. Otun", initials: "MO" },
  workspaces: [{ id: "wsp_formulation", ownerId: "usr_motun", name: "Algonix AI · Formulation" }],
  activeWorkspaceId: "wsp_formulation",
  recentRuns: [],
};

const context = {
  route: "SC",
  dose: { value: 150, unit: "mg" },
  frequency: "q2w",
  conc_mg_mL: 0.2,
  storage_C: 25,
} as const;

const PS80_STRUCTURE = {
  id: "1N8Z",
  label: "1N8Z Fab",
  chains: [
    { id: "A", label: "Light chain", excludedByDefault: false },
    { id: "B", label: "Heavy chain (Fab)", excludedByDefault: false },
    { id: "C", label: "Antigen", excludedByDefault: true },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  lookupIdentity.mockResolvedValue({
    ok: true,
    data: { status: "resolved", name: "Polysorbate 80", cas: "9005-65-6" },
  });
  lookupStructure.mockResolvedValue({ ok: true, data: PS80_STRUCTURE });
  startRun.mockImplementation(async () => ({
    ok: true,
    data: {
      runId: "RUN-2026-0919-5000",
      kind: "single",
      title: "Polysorbate 80 × 1N8Z Fab",
      route: "SC",
      context,
      createdAt: "2026-09-19T10:00:00Z",
      review: { status: "draft", version: 1 },
    },
  }));
});

const panel = () => within(screen.getByRole("complementary", { name: "Input" }));

async function fillValidPdb(user: ReturnType<typeof userEvent.setup>) {
  await user.type(panel().getByRole("textbox", { name: "Name, CAS or SMILES" }), "Polysorbate 80");
  await user.type(panel().getByRole("textbox", { name: "PDB ID" }), "1n8z");
  await user.tab(); // blur → chain lookup
  await panel().findByRole("button", { name: /Light chain/ });
  await user.type(panel().getByRole("textbox", { name: "Protein dose" }), "150");
  await user.type(panel().getByRole("textbox", { name: "Excipient concentration" }), "0.2");
}

describe("input panel", () => {
  it("starts empty with SC and 25 °C selected and no Draw structure button", () => {
    render(<Screen data={data} />);
    expect(panel().getByRole("textbox", { name: "Name, CAS or SMILES" })).toHaveValue("");
    expect(panel().getByRole("button", { name: "SC" })).toHaveAttribute("aria-pressed", "true");
    expect(panel().getByRole("button", { name: "25 °C" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("button", { name: /Draw structure/ })).not.toBeInTheDocument();
  });

  it("uses monospace for the excipient, IDs and sequences", async () => {
    const user = userEvent.setup();
    render(<Screen data={data} />);
    expect(panel().getByRole("textbox", { name: "Name, CAS or SMILES" })).toHaveClass("font-mono");
    expect(panel().getByRole("textbox", { name: "PDB ID" })).toHaveClass("font-mono");
    await user.click(panel().getByRole("tab", { name: "Sequence" }));
    expect(panel().getByRole("textbox", { name: /Sequence \(FASTA/ })).toHaveClass("font-mono");
  });

  it("shows the resolved identity after the excipient field loses focus", async () => {
    const user = userEvent.setup();
    render(<Screen data={data} />);
    await user.type(panel().getByRole("textbox", { name: "Name, CAS or SMILES" }), "9005-65-6");
    await user.tab();
    expect(
      await panel().findByText("Resolved: Polysorbate 80 · CAS 9005-65-6"),
    ).toBeInTheDocument();
    expect(lookupIdentity).toHaveBeenCalledWith({ query: "9005-65-6" });
  });

  it("reveals the polymer fields with the switch", async () => {
    const user = userEvent.setup();
    render(<Screen data={data} />);
    const polymer = panel().getByRole("switch", { name: "Polymer" });
    expect(polymer).toHaveAttribute("aria-checked", "false");
    expect(panel().queryByRole("textbox", { name: "Repeat unit" })).not.toBeInTheDocument();
    await user.click(polymer);
    expect(polymer).toHaveAttribute("aria-checked", "true");
    for (const name of ["Repeat unit", "End groups", "Approx. DP", "Residual monomers"]) {
      expect(panel().getByRole("textbox", { name })).toBeInTheDocument();
    }
    expect(panel().getByRole("textbox", { name: "Repeat unit" })).toHaveClass("font-mono");
  });

  it("shows inline errors, announces them and focuses the first invalid field", async () => {
    const user = userEvent.setup();
    render(<Screen data={data} />);
    await user.click(screen.getByRole("button", { name: "Run screen" }));
    expect(startRun).not.toHaveBeenCalled();
    const excipient = panel().getByRole("textbox", { name: "Name, CAS or SMILES" });
    expect(excipient).toHaveAttribute("aria-invalid", "true");
    expect(excipient).toHaveAccessibleDescription("Enter a name, CAS or SMILES.");
    await waitFor(() => expect(excipient).toHaveFocus());
    expect(panel().getByRole("alert")).toHaveTextContent("Check the 4 highlighted fields.");

    await user.type(excipient, "CCO");
    expect(excipient).toHaveAttribute("aria-invalid", "false");
  });

  it("calls startRun with the typed input and fills the header", async () => {
    const user = userEvent.setup();
    render(<Screen data={data} />);
    await fillValidPdb(user);
    await user.click(screen.getByRole("button", { name: "Run screen" }));
    expect(startRun).toHaveBeenCalledWith({
      excipient: { query: "Polysorbate 80", polymer: null },
      protein: { source: "pdb", id: "1N8Z", chains: ["A", "B"], excludedChains: ["C"] },
      context,
    });
    expect(await screen.findByText("Single screen · RUN-2026-0919-5000")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Polysorbate 80 × 1N8Z Fab",
    );
  });

  it("lets the user include or exclude chains", async () => {
    const user = userEvent.setup();
    render(<Screen data={data} />);
    await fillValidPdb(user);
    const antigen = panel().getByRole("button", { name: /Antigen/ });
    expect(antigen).toHaveAttribute("aria-pressed", "false");
    expect(antigen).toHaveTextContent("Antigen, excluded");
    await user.click(antigen);
    await user.click(panel().getByRole("button", { name: /Light chain/ }));
    await user.click(screen.getByRole("button", { name: "Run screen" }));
    expect(startRun.mock.calls[0]?.[0]).toMatchObject({
      protein: { chains: ["B", "C"], excludedChains: ["A"] },
    });
  });

  it("sends only the active protein tab", async () => {
    const user = userEvent.setup();
    render(<Screen data={data} />);
    await fillValidPdb(user);
    await user.click(panel().getByRole("tab", { name: "UniProt ID" }));
    await user.type(panel().getByRole("textbox", { name: "UniProt ID" }), "p04626");
    expect(panel().getByText(/liability sites are graded C/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Run screen" }));
    expect(startRun.mock.calls[0]?.[0]).toMatchObject({
      protein: { source: "uniprot", id: "P04626" },
    });
    expect(startRun.mock.calls[0]?.[0].protein).not.toHaveProperty("chains");
  });

  it("reports a server rejection as an alert and keeps the header", async () => {
    const user = userEvent.setup();
    startRun.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "invalid_input",
        message: "Some inputs aren't valid. Check the highlighted fields.",
      },
    });
    render(<Screen data={data} />);
    await fillValidPdb(user);
    await user.click(screen.getByRole("button", { name: "Run screen" }));
    expect(await screen.findByText(/Some inputs aren't valid/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("New screen");
  });

  it("Load example fills the whole panel and the header", async () => {
    const user = userEvent.setup();
    loadExample.mockResolvedValue({
      ok: true,
      data: {
        example: {
          title: "Polysorbate 80 × 1N8Z Fab",
          input: {
            excipient: {
              query: "Polysorbate 80",
              polymer: {
                repeatUnit: "-(CH2CH2O)-",
                endGroups: "Sorbitan monooleate ester / –OH",
                dp: "w+x+y+z ≈ 20",
                residualMonomers: ["Ethylene oxide", "1,4-dioxane"],
              },
            },
            protein: { source: "pdb", id: "1N8Z", chains: ["A", "B"], excludedChains: ["C"] },
            context,
          },
        },
        structure: PS80_STRUCTURE,
        identity: { status: "resolved", name: "Polysorbate 80", cas: "9005-65-6" },
      },
    });
    render(<Screen data={data} />);
    await user.click(screen.getByRole("button", { name: /Load example/ }));
    expect(
      await panel().findByText("Resolved: Polysorbate 80 · CAS 9005-65-6"),
    ).toBeInTheDocument();
    expect(panel().getByRole("switch", { name: "Polymer" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(panel().getByRole("textbox", { name: "Residual monomers" })).toHaveValue(
      "Ethylene oxide, 1,4-dioxane",
    );
    expect(panel().getByRole("textbox", { name: "PDB ID" })).toHaveValue("1N8Z");
    expect(panel().getByRole("button", { name: /Antigen/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(panel().getByRole("textbox", { name: "Protein dose" })).toHaveValue("150");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Polysorbate 80 × 1N8Z Fab",
    );

    await user.click(screen.getByRole("button", { name: "Run screen" }));
    expect(startRun.mock.calls[0]?.[0]).toMatchObject({
      excipient: { polymer: { residualMonomers: ["Ethylene oxide", "1,4-dioxane"] } },
    });
  });

  it("can be disabled as a whole (Build 07)", () => {
    render(
      <ScreenContext.Provider value={{ state: initialScreenState, dispatch: vi.fn() }}>
        <RunInputProvider>
          <InputPanel disabled />
        </RunInputProvider>
      </ScreenContext.Provider>,
    );
    expect(panel().getByRole("textbox", { name: "Name, CAS or SMILES" })).toBeDisabled();
    expect(panel().getByRole("switch", { name: "Polymer" })).toBeDisabled();
    expect(panel().getByRole("tab", { name: "UniProt ID" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Run screen" })).toBeDisabled();
  });
});
