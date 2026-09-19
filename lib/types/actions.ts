export type ActionErrorCode = "invalid_input" | "not_found" | "forbidden" | "not_connected";

/** Every Server Action returns this instead of throwing to the client (CODING_STANDARDS §5). */
export type ActionResult<T> =
  { ok: true; data: T } | { ok: false; error: { code: ActionErrorCode; message: string } };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(code: ActionErrorCode, message: string): ActionResult<T> {
  return { ok: false, error: { code, message } };
}
