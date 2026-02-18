import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import CreatePostForm from "@/app/components/CreatePostForm";

export default async function CreatePostPage() {
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

  return (
    <main className="min-h-screen bg-gray-50 py-6">
      <section className="mx-auto w-full max-w-2xl px-4">
        <CreatePostForm />
      </section>
    </main>
  );
}
