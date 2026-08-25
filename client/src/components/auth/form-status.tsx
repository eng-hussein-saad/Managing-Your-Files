import { Status } from "../ui/surfaces";

/** Announces a form outcome without moving keyboard focus unexpectedly. */
export function FormStatus({
  message,
  kind = "info",
}: {
  message?: string;
  kind?: "info" | "error" | "success";
}) {
  if (!message) return null;
  return <Status tone={kind === "error" ? "danger" : kind}>{message}</Status>;
}
