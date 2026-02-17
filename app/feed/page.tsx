import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";

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

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-6">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Feed</h1>
        <div className="flex items-center gap-4">
          <Link className="underline" href="/profile/setup">
            @{appUser.username}
          </Link>
          <Link className="underline" href="/auth/logout">
            Logout
          </Link>
        </div>
      </header>

      <section className="rounded-lg border bg-white p-4">
        <p className="text-sm text-gray-600">Signed in as</p>
        <p className="font-medium">{user.email}</p>
      </section>
    </main>
  );
}
