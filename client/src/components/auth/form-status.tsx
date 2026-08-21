/** Announces a form outcome without moving keyboard focus unexpectedly. */
export function FormStatus({
  message,
  kind = "info",
}: {
  message?: string;
  kind?: "info" | "error" | "success";
}) {
  if (!message) return null;
  return (
    <p
      className={`form-status ${kind}`}
      role={kind === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  );
}
