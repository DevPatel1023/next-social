import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

type CommentBody = {
  postId?: string;
  text?: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as CommentBody;
  const postId = body.postId?.trim();
  const text = body.text?.trim();

  if (!postId || !text) {
    return NextResponse.json(
      { error: "postId and text are required." },
      { status: 400 },
    );
  }

  const payloads = [
    { post_id: postId, user_id: user.id, content: text },
    { post_id: postId, user_id: user.id, text },
    { post_id: postId, user_id: user.id, body: text },
    { post_id: postId, user_id: user.id, comment: text },
  ];

  let insertedId = "";
  let inserted = false;
  let lastError = "Could not post comment";

  for (const payload of payloads) {
    const { data, error } = await supabase
      .from("comments")
      .insert(payload)
      .select("id")
      .single();

    if (!error) {
      inserted = true;
      insertedId = typeof data?.id === "string" ? data.id : `${Date.now()}`;
      break;
    }

    lastError = error.message;
  }

  if (!inserted) {
    return NextResponse.json({ error: lastError }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json(
    {
      comment: {
        id: insertedId,
        author: profile?.username ?? "you",
        text,
      },
    },
    { status: 200 },
  );
}
