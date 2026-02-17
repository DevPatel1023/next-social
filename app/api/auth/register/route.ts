import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

type RegisterBody = {
  email?: string;
  password?: string;
};

async function syncUserToUsersTable(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: User,
) {
  const email = user.email ?? "";

  const { error } = await supabase
    .from("users")
    .upsert({ id: user.id, email }, { onConflict: "id" });
  return error ? error.message : null;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as RegisterBody;
  const email = body.email?.trim();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

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
