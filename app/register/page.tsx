"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuthStore } from "@/app/store/auth.store";
import { toast } from "react-toastify";

type RegisterForm = {
  email: string;
  password: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    const result = await registerUser(data.email, data.password);

    if (result.error) {
      toast.error("Registration failed: " + result.error);
      return;
    }

    if (result.requiresEmailConfirmation) {
      toast.info("Check your email to confirm your account.");
      return;
    }

    toast.success("Registration successful!");
    router.push("/feed");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-100 to-gray-200 px-4">
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-8 shadow-xl"
      >
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-gray-500">
            Get started in just a few seconds
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
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Enter a valid email",
                },
              })}
            />
            {errors.email && (
              <p className="text-xs text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <span className="text-black font-medium">Password</span>
            <input
              type="password"
              placeholder="Password (min 8 characters)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
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
          {isSubmitting ? "Creating account..." : "Register"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-black underline-offset-4 hover:underline"
          >
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
