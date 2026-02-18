import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/app/lib/supabase/server";
import Post from "@/app/components/Post";
import { loadPostsWithComments, resolveImageSource } from "@/app/lib/social";

function initialsFromUsername(value: string) {
  const cleaned = value.trim();
  return cleaned ? cleaned.slice(0, 2).toUpperCase() : "ME";
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: appUser } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle();

  if (!appUser?.username) {
    redirect("/profile/setup");
  }

  const avatarRaw =
    typeof appUser.avatar_url === "string"
      ? appUser.avatar_url
      : typeof appUser.avatar === "string"
        ? appUser.avatar
        : typeof appUser.image_url === "string"
          ? appUser.image_url
          : "";
  const avatarUrl = avatarRaw ? await resolveImageSource(supabase, avatarRaw) : "";

  const posts = await loadPostsWithComments(supabase, {
    userId: user.id,
    fallbackUsername: appUser.username,
  });

  return (
    <main className="min-h-screen bg-gray-50 py-6">
      <section className="mx-auto w-full max-w-3xl space-y-5 px-4">
        <div className="rounded-sm border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarImage src={avatarUrl} alt={appUser.username} />
              <AvatarFallback>{initialsFromUsername(appUser.username)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Profile</p>
              <h1 className="text-xl font-semibold text-gray-900">@{appUser.username}</h1>
            </div>
          </div>
        </div>

        {posts.map((post) => (
          <Post
            key={post.id}
            id={post.id}
            author={post.author}
            caption={post.caption}
            images={post.images}
            initialComments={post.comments}
          />
        ))}

        {posts.length === 0 ? (
          <div className="rounded-sm border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
            You have not posted anything yet.
          </div>
        ) : null}
      </section>
    </main>
  );
}
