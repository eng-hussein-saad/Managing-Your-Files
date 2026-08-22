import { SupabaseStorage } from "./supabase-storage.js";
/** Verifies the configured storage boundary before accepting file traffic. */
export async function assertStorageReady(
  storage: SupabaseStorage,
): Promise<void> {
  await storage.assertPrivateBucket();
}
