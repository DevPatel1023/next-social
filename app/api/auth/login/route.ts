import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { syncUserToUsersTable } from "@/app/lib/SyncUser";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LoginBody;
  const email = body.email?.trim();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (data.user) {
    const syncError = await syncUserToUsersTable(supabase, data.user);
    if (syncError) {
      return NextResponse.json(
        { error: `Login succeeded, but users table sync failed: ${syncError}` },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
