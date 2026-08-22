import type { FileSummary, QuotaSnapshot } from "@gold-era/contracts/public";
export interface QueueItem {
  id: string;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  result?: FileSummary;
  error?: string;
  quota?: QuotaSnapshot;
}
