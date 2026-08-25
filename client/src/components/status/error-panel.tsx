import { Button } from "../ui/controls";
import { ErrorState } from "../ui/surfaces";

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
    <ErrorState
      title={title}
      description={message}
      action={retry ? <Button onClick={retry}>Try again</Button> : undefined}
    />
  );
}
