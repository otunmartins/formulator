import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";
import { Drawer } from "./Drawer";
import { GradeBadge } from "./GradeBadge";
import { Menu, MenuGroup, MenuItem } from "./Menu";
import { Modal } from "./Modal";
import { NoticeProvider, useNotice } from "./Notice";
import { Segmented } from "./Segmented";
import { Tabs } from "./Tabs";
import { VerdictChip } from "./VerdictChip";

function ModalHarness({ kind }: { kind: "modal" | "drawer" }) {
  const [open, setOpen] = useState(false);
  const Container = kind === "modal" ? Modal : Drawer;
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <Container open={open} onClose={() => setOpen(false)} title="Dialog title">
        <Button>First action</Button>
        <Button>Last action</Button>
      </Container>
    </>
  );
}

describe.each(["modal", "drawer"] as const)("%s", (kind) => {
  it("moves focus in, traps Tab, closes on Esc and restores focus", async () => {
    const user = userEvent.setup();
    render(<ModalHarness kind={kind} />);
    const opener = screen.getByRole("button", { name: "Open" });
    await user.click(opener);

    const dialog = screen.getByRole("dialog", { name: "Dialog title" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    const close = screen.getByRole("button", { name: "Close" });
    expect(close).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "First action" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Last action" })).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Last action" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});

describe("Menu", () => {
  function renderMenu(onSelect = vi.fn()) {
    render(
      <Menu label="Workspaces" trigger="Account">
        <MenuGroup label="Workspace">
          <MenuItem checked={false} onSelect={() => onSelect("a")}>
            Alpha
          </MenuItem>
          <MenuItem checked onSelect={() => onSelect("b")}>
            Beta
          </MenuItem>
        </MenuGroup>
        <MenuItem onSelect={() => onSelect("out")}>Sign out</MenuItem>
      </Menu>,
    );
    return onSelect;
  }

  it("opens from the keyboard, focuses the checked item and moves with arrows", async () => {
    const user = userEvent.setup();
    renderMenu();
    const trigger = screen.getByRole("button", { name: "Account" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.tab();
    await user.keyboard("{ArrowDown}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitemradio", { name: "Beta" })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Sign out" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitemradio", { name: "Alpha" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("menuitem", { name: "Sign out" })).toHaveFocus();
  });

  it("selects with Enter and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const onSelect = renderMenu();
    await user.click(screen.getByRole("button", { name: "Account" }));
    await user.keyboard("{Home}{Enter}");
    expect(onSelect).toHaveBeenCalledWith("a");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Account" })).toHaveFocus();
  });

  it("closes on Esc and on a click outside", async () => {
    const user = userEvent.setup();
    renderMenu();
    const trigger = screen.getByRole("button", { name: "Account" });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await user.click(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});

describe("GradeBadge", () => {
  it("shows the A–E legend on keyboard focus and hides it on blur or Esc", async () => {
    const user = userEvent.setup();
    render(<GradeBadge grade="C" />);
    const badge = screen.getByRole("button", { name: "Evidence grade C" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    await user.tab();
    expect(badge).toHaveFocus();
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("In-domain prediction");
    expect(tooltip).toHaveTextContent("No data");
    expect(badge).toHaveAccessibleDescription(/In-domain prediction/);

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows the legend on hover", async () => {
    const user = userEvent.setup();
    render(<GradeBadge grade="A" />);
    await user.hover(screen.getByRole("button", { name: "Evidence grade A" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent("Regulatory precedent");
    await user.unhover(screen.getByRole("button", { name: "Evidence grade A" }));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});

describe("VerdictChip", () => {
  it("renders text, never colour alone", () => {
    render(<VerdictChip verdict="alert" count={1} />);
    expect(screen.getByText("Alert: avoid")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});

describe("Segmented", () => {
  it("marks the selected option with aria-pressed", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Segmented
        label="Mode"
        value="single"
        onChange={onChange}
        options={[
          { value: "single", label: "Single" },
          { value: "batch", label: "Batch" },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "Single" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Batch" }));
    expect(onChange).toHaveBeenCalledWith("batch");
  });
});

describe("Tabs", () => {
  it("moves selection with arrow keys", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [tab, setTab] = useState<"pdb" | "uniprot">("pdb");
      return (
        <Tabs
          label="Protein source"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "pdb", label: "PDB ID" },
            { id: "uniprot", label: "UniProt ID" },
          ]}
        >
          Panel {tab}
        </Tabs>
      );
    }
    render(<Harness />);
    await user.tab();
    expect(screen.getByRole("tab", { name: "PDB ID" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "UniProt ID" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "UniProt ID" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Panel uniprot");
  });
});

describe("Notice", () => {
  function Trigger() {
    const notify = useNotice();
    return (
      <>
        <Button onClick={() => notify("Not connected yet")}>Stub</Button>
        <Button onClick={() => notify("This run isn't in your current workspace.", "error")}>
          Fail
        </Button>
      </>
    );
  }

  it("announces stubs politely and errors as alerts", async () => {
    const user = userEvent.setup();
    render(
      <NoticeProvider>
        <Trigger />
      </NoticeProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Stub" }));
    expect(screen.getByRole("status")).toHaveTextContent("Not connected yet");
    await user.click(screen.getByRole("button", { name: "Fail" }));
    expect(screen.getByRole("alert")).toHaveTextContent("isn't in your current workspace");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
