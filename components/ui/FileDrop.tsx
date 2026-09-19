"use client";

import { useState, type DragEvent } from "react";
import { cn } from "@/lib/utils/cn";
import { Icon } from "./Icon";

export interface FileDropProps {
  id: string;
  /** e.g. ".pdb,.ent,.cif,.mmcif" */
  accept: string;
  /** Shown inside the zone, e.g. "PDB or mmCIF, up to 20 MB". */
  description: string;
  fileName: string | null;
  onFile: (file: File) => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/**
 * Drop zone with a real file input (keyboard: Tab to it, Enter or Space opens the picker).
 * Only the file's name, type and size are read in Phase 1; nothing is uploaded.
 */
export function FileDrop({
  id,
  accept,
  description,
  fileName,
  onFile,
  disabled,
  ...aria
}: FileDropProps) {
  const [dragging, setDragging] = useState(false);

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && !disabled) onFile(file);
  }

  return (
    <label
      htmlFor={id}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-1.5 rounded-card border border-dashed px-4 py-6 text-center focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent",
        dragging ? "border-accent bg-accent-soft" : "border-border-strong bg-surface-subtle",
        aria["aria-invalid"] && "border-alert-text",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <Icon name="download" className="size-5 rotate-180 text-muted" />
      {fileName ? (
        <span className="font-mono text-xs font-medium break-all text-text">{fileName}</span>
      ) : (
        <span className="text-[13px] font-medium text-text">Drop a file or choose one</span>
      )}
      <span className="text-xs text-muted">{description}</span>
      <input
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
        {...aria}
      />
    </label>
  );
}
