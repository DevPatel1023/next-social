import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

type CommentBody = {
  postId?: string;
  text?: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();

  // 1. Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  const body = (await request.json().catch(() => ({}))) as CommentBody;
  const postId = body.postId?.trim();
  const text = body.text?.trim();

  if (!postId || !text) {
    return NextResponse.json(
      { error: "postId and text are required." },
      { status: 400 },
    );
  }

  // 3. Insert comment
  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      text, 
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // 4. Fetch username
  const { data: profile } = await supabase
    .from("users")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  // 5. Return created comment
  return NextResponse.json(
    {
      comment: {
        id: data.id,
        author: profile?.username ?? "you",
        text,
      },
    },
    { status: 200 },
  );
}
