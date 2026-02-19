"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

type ProfileResponse = {
  profile?: {
    username: string | null;
  };
  error?: string;
};

export default function ProfileSetupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/profile", { method: "GET" });
        if (!response.ok) return;

        const result = (await response.json()) as ProfileResponse;
        if (result.profile?.username) {
          router.replace("/feed");
          return;
        }
      } finally {
        setHydrating(false);
      }
    };

    void loadProfile();
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const result = (await response.json()) as ProfileResponse;

      if (!response.ok) {
        toast.error(result.error ?? "Could not update profile");
        return; 
      }

      toast.success("Username saved successfully!");
      router.push("/feed");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (hydrating) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center px-4">
        <p className="text-sm text-gray-600">Loading profile setup...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full space-y-4 rounded-xl border bg-white p-6"
      >
        <h1 className="text-2xl font-bold">Choose your username</h1>
        <p className="text-sm text-gray-600">
          This username will identify you in the app.
        </p>

        <input
          className="w-full rounded border p-2"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          maxLength={30}
        />

        <button
          disabled={loading}
          className="w-full rounded bg-black py-2 text-white disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save username"}
        </button>
      </form>
    </main>
  );
}
