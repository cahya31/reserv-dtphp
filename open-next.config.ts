import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Cache incremental tidak dipakai — aplikasi ini tidak memakai ISR/revalidate.
});
