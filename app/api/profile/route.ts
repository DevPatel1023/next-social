import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

type ProfileBody = {
  username?: string;
};

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function isValidUsername(value: string) {
  return /^[a-z0-9_]{3,30}$/.test(value);
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, email, username, created_at")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ profile: data }, { status: 200 });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as ProfileBody;
  const username = normalizeUsername(body.username ?? "");

  if (!isValidUsername(username)) {
    return NextResponse.json(
      {
        error:
          "Username must be 3-30 chars and contain only lowercase letters, numbers, or underscores.",
      },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("users")
    .update({ username })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
