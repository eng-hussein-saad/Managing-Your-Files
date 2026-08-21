/** Displays a reusable actionable failure region. */
export function ErrorPanel({
  title = "Something went wrong",
  message,
  retry,
}: {
  title?: string;
  message: string;
  retry?: () => void;
}) {
  return (
    <section className="error-panel" role="alert">
      <h2>{title}</h2>
      <p>{message}</p>
      {retry ? (
        <button className="button" onClick={retry}>
          Try again
        </button>
      ) : null}
    </section>
  );
}
