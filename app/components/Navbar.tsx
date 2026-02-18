import Link from "next/link";
import { createClient } from "@/app/lib/supabase/server";
import { IoLogOutOutline } from "react-icons/io5";
import { Avatar } from "@/components/ui/avatar";


export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: appUser } = user
    ? await supabase.from("users").select("*").eq("id", user.id).maybeSingle()
    : { data: null };


  return (
    <nav className="sticky top-0 bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <Link href={user ? "/feed" : "/login"} className="text-lg font-semibold">
          Mysocial
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link href="/profile" className="flex items-center gap-2">
                <Avatar size="default" className="hover:bg-gray-200 transition duration-150 delay-150">
                  <span className="flex h-full w-full items-center justify-center font-semibold">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
                </Avatar>
              </Link>
              <Link href="/auth/logout" className="underline-offset-4 hover:underline">
                <IoLogOutOutline size={25} />
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="underline-offset-4 hover:underline">
                Login
              </Link>
              <Link href="/register" className="underline-offset-4 hover:underline">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
