import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Field } from "./Field";
import { FileDrop } from "./FileDrop";
import { Select } from "./Select";
import { Switch } from "./Switch";
import { TextInput } from "./TextInput";

describe("Field", () => {
  it("labels the control and describes it with the hint and error", () => {
    render(
      <Field label="Excipient concentration" hint="Final product" error="Enter a concentration.">
        {(p) => <TextInput {...p} unit="mg/mL" />}
      </Field>,
    );
    const input = screen.getByRole("textbox", { name: "Excipient concentration" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Enter a concentration. Final product mg/mL");
  });

  it("is valid without an error", () => {
    render(<Field label="PDB ID">{(p) => <TextInput {...p} mono />}</Field>);
    const input = screen.getByRole("textbox", { name: "PDB ID" });
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(input).toHaveClass("font-mono");
  });
});

describe("Switch", () => {
  it("toggles with the keyboard and reports its state", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch label="Polymer" checked={false} onChange={onChange} />);
    const sw = screen.getByRole("switch", { name: "Polymer" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    await user.tab();
    await user.keyboard(" ");
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe("Select", () => {
  it("reports the chosen typed option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Select
        aria-label="Frequency"
        value="q2w"
        onChange={onChange}
        options={[
          { value: "q2w", label: "Every 2 weeks" },
          { value: "q4w", label: "Every 4 weeks" },
        ]}
      />,
    );
    await user.selectOptions(screen.getByRole("combobox", { name: "Frequency" }), "Every 4 weeks");
    expect(onChange).toHaveBeenCalledWith("q4w");
  });
});

describe("FileDrop", () => {
  it("passes the chosen file and shows its name", async () => {
    const user = userEvent.setup();
    const onFile = vi.fn();
    const { rerender } = render(
      <FileDrop
        id="f"
        accept=".pdb,.cif"
        description="PDB or mmCIF"
        fileName={null}
        onFile={onFile}
      />,
    );
    const file = new File(["ATOM"], "fab.cif", { type: "chemical/x-cif" });
    await user.upload(screen.getByLabelText(/Drop a file or choose one/), file);
    expect(onFile).toHaveBeenCalledWith(file);
    rerender(
      <FileDrop
        id="f"
        accept=".pdb,.cif"
        description="PDB or mmCIF"
        fileName="fab.cif"
        onFile={onFile}
      />,
    );
    expect(screen.getByText("fab.cif")).toBeInTheDocument();
  });
});
