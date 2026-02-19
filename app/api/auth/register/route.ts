import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { syncUserToUsersTable } from "@/app/lib/SyncUser";
import { authSchema } from "@/app/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = authSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request body." },
      { status: 400 },
    );
  }
  const { email, password } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (data.user) {
    const syncError = await syncUserToUsersTable(supabase, data.user);
    if (syncError) {
      return NextResponse.json(
        { error: `Auth created, but users table sync failed: ${syncError}` },
        { status: 500 },
      );
    }
  }

  const requiresEmailConfirmation = !data.session;
  return NextResponse.json(
    { success: true, requiresEmailConfirmation },
    { status: 200 },
  );
}
