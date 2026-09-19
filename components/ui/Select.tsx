import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { controlClassName } from "./controlStyles";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export interface SelectProps<T extends string> extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "onChange" | "value"
> {
  options: readonly SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Native select (keyboard and screen-reader behaviour for free), styled like the inputs. */
export function Select<T extends string>({
  options,
  value,
  onChange,
  className,
  ...rest
}: SelectProps<T>) {
  return (
    <select
      value={value}
      onChange={(e) => {
        const next = options.find((o) => o.value === e.target.value);
        if (next) onChange(next.value);
      }}
      className={cn(controlClassName, "h-9 pr-1", className)}
      {...rest}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
