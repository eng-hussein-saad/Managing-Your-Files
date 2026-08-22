"use client";
import { downloadFile } from "../api/file-content.api";
/** Renders an accessible server-authorized download trigger. */
export function FileDownload({ id, name }: { id: string; name: string }) {
  const download = /** Implements the local download operation. */ async () => {
    const blob = await downloadFile(id);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button
      type="button"
      onClick={
        /** Handles the bound UI event or state projection for this JSX control. */ () =>
          void download()
      }
      aria-label={`Download ${name}`}
    >
      Download
    </button>
  );
}
