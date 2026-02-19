"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuthStore } from "@/app/store/auth.store";
import { toast } from "react-toastify";
import { authSchema, type AuthInput } from "@/app/lib/validation";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthInput>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: AuthInput) => {
    const result = await login(data.email, data.password);

    if (result.error) {
      toast.error("Login failed: " + result.error);
      return;
    }

    toast.success("Login successful!");
    router.push("/feed");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-100 to-gray-200 px-4">
      <form
      noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-8 shadow-xl"
      >
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-gray-500">
            Sign in to continue
          </p>
        </div>

        <div className="space-y-4">
          {/* Email */}
          <div className="space-y-1">
            <span className="text-black font-medium">Email</span>
            <input
              type="email"
              placeholder="Email address"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <span className="text-black font-medium">Password</span>
            <input
              type="password"
              placeholder="Password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        <button
          disabled={isSubmitting}
          className="w-full rounded-lg bg-black py-2.5 text-sm font-medium text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-black underline-offset-4 hover:underline"
          >
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
