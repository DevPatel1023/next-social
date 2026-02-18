import { createClient } from "@/app/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export async function syncUserToUsersTable(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: User,
) {
  const { error } = await supabase
    .from("users")
    .upsert({ id: user.id, email: user.email ?? "" }, { onConflict: "id" });
  return error ? error.message : null;
}