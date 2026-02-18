import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import Post from "@/app/components/Post";
import { loadPostsWithComments } from "@/app/lib/social";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: appUser } = await supabase
    .from("users")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (!appUser?.username) {
    redirect("/profile/setup");
  }

  const feedItems = await loadPostsWithComments(supabase, {
    fallbackUsername: appUser.username,
  });

  return (
    <main className="min-h-screen bg-gray-50 py-6">
      <section className="mx-auto w-full max-w-3xl space-y-5 px-4">
        {feedItems.map((post) => (
          <Post
            key={post.id}
            id={post.id}
            author={post.author}
            caption={post.caption}
            images={post.images}
            initialComments={post.comments}
          />
        ))}

        {feedItems.length === 0 ? (
          <div className="rounded-sm border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
            No posts yet.
          </div>
        ) : null}
      </section>
    </main>
  );
}
