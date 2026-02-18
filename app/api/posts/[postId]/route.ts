import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

type RawRow = Record<string, unknown>;

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function parseStringList(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => asString(item).trim())
      .filter((item) => item.length > 0);
  }

  const raw = asString(value).trim();
  if (!raw) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => asString(item).trim())
        .filter((item) => item.length > 0);
    }
  } catch {}

  return [raw];
}

function toBucketPath(value: string) {
  const raw = value.trim();
  if (!raw || raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("/")) {
    return null;
  }
  const slashIndex = raw.indexOf("/");
  if (slashIndex <= 0 || slashIndex >= raw.length - 1) {
    return null;
  }
  return {
    bucket: raw.slice(0, slashIndex),
    path: raw.slice(slashIndex + 1),
  };
}

export async function DELETE(
  _request: Request,
  { params }: { params: { postId: string } },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;
  if (!postId) {
    return NextResponse.json({ error: "Invalid post id." }, { status: 400 });
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, user_id, images")
    .eq("id", postId)
    .maybeSingle();

  if (postError) {
    return NextResponse.json({ error: postError.message }, { status: 400 });
  }

  if (!post) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const row = post as RawRow;
  if (asString(row.user_id) !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const imagePaths = parseStringList(row.images);
  for (const imagePath of imagePaths) {
    const parsed = toBucketPath(imagePath);
    if (!parsed) {
      continue;
    }
    await supabase.storage.from(parsed.bucket).remove([parsed.path]);
  }

  const { error: deleteCommentsError } = await supabase
    .from("comments")
    .delete()
    .eq("post_id", postId);
  if (deleteCommentsError) {
    return NextResponse.json({ error: deleteCommentsError.message }, { status: 400 });
  }

  const { error: deletePostError } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", user.id);
  if (deletePostError) {
    return NextResponse.json({ error: deletePostError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
