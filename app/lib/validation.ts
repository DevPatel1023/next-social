import { z } from "zod";

export const emailSchema = z.email("Enter a valid email");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

export const authSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9_]{3,30}$/,
    "Username must be 3-30 chars and contain only lowercase letters, numbers, or underscores.",
  );

export const profileSchema = z.object({
  username: usernameSchema,
});

export const createCommentSchema = z.object({
  postId: z.string().trim().min(1, "postId is required."),
  text: z.string().trim().min(1, "text is required."),
});

export const createPostClientSchema = z
  .object({
    title: z.string().max(100, "Title cannot exceed 100 characters"),
    body: z.string().max(250, "Body cannot exceed 250 characters"),
  })
  .superRefine((value, ctx) => {
    if (!value.title.trim() && !value.body.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add a title or body, or attach images.",
        path: ["body"],
      });
    }
  });

export const createPostServerSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "title is required.")
    .max(100, "Title cannot exceed 100 characters"),
  body: z
    .string()
    .trim()
    .min(1, "body is required.")
    .max(250, "Body cannot exceed 250 characters"),
});

export type AuthInput = z.infer<typeof authSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreatePostClientInput = z.infer<typeof createPostClientSchema>;
export type CreatePostServerInput = z.infer<typeof createPostServerSchema>;
