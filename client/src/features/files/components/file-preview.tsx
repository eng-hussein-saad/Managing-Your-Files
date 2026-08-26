"use client";
import { useEffect, useState } from "react";
import { useFilePreview } from "../hooks/use-file-content";
import { Skeleton } from "../../../components/ui/surfaces";
/** Renders an owner-authorized image, PDF, text, or unavailable preview state. */
export function FilePreview({
  id,
  mimeType,
  kind,
}: {
  id: string;
  mimeType: string;
  kind: "image" | "pdf" | "text" | "unavailable";
}) {
  const preview = useFilePreview(id, kind !== "unavailable");
  const [url, setUrl] = useState<string | null>(null);
  useEffect(
    /** Executes the callback required by the surrounding operation. */ () => {
      if (!preview.data) return;
      const next = URL.createObjectURL(preview.data);
      setUrl(next);
      return /** Executes this localized callback for its immediately surrounding operation. */ () =>
        URL.revokeObjectURL(next);
    },
    [preview.data],
  );
  if (kind === "unavailable")
    return (
      <p className="ui-status warning">
        Preview is unavailable. Download the original file instead.
      </p>
    );
  if (preview.isLoading)
    return <Skeleton label="Loading preview" lines={5} />;
  if (preview.isError || !url)
    return (
      <p className="ui-status danger" role="alert">
        Preview could not be loaded.
      </p>
    );
  if (kind === "image") return <img src={url} alt="File preview" />;
  if (kind === "pdf") return <iframe src={url} title="PDF preview" />;
  return <iframe src={url} title={`Text preview (${mimeType})`} />;
}
