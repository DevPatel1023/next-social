import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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

  if (postError) return NextResponse.json({ error: postError.message }, { status: 400 });
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  if (post.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // images is jsonb array of storage paths like "post-images/userId/filename.jpg"
  const imagePaths: string[] = Array.isArray(post.images) ? post.images : [];
  for (const imagePath of imagePaths) {
    const slashIndex = imagePath.indexOf("/");
    if (slashIndex > 0) {
      const bucket = imagePath.slice(0, slashIndex);
      const path = imagePath.slice(slashIndex + 1);
      await supabase.storage.from(bucket).remove([path]);
    }
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
