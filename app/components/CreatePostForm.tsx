"use client";

import { useRouter } from "next/navigation";
import { usePostStore } from "@/app/store/post.store";
import { toast } from "react-toastify";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  createPostClientSchema,
  type CreatePostClientInput,
} from "@/app/lib/validation";

export default function CreatePostForm() {
  const router = useRouter();

  const {
    createImages: images,
    createLoading: loading,
    addCreateImages: addImages,
    removeCreateImage: removeImage,
    submitCreatePost,
    setCreateTitle: setTitle,
    setCreateBody: setBody,
  } = usePostStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePostClientInput>({
    resolver: zodResolver(createPostClientSchema),
    defaultValues: {
      title: "",
      body: "",
    },
  });

  const onSubmit = async (data: CreatePostClientInput) => {
    // sync RHF data to Zustand
    setTitle(data.title);
    setBody(data.body);

    // empty post validation
    if (!data.title.trim() && !data.body.trim() && images.length === 0) {
      toast.error("Post cannot be empty");
      return;
    }

    const result = await submitCreatePost();

    if (result?.error) {
      toast.error("Failed to create post: " + result.error);
      return;
    }

    toast.success("Post created successfully!");
    router.push("/feed");
    router.refresh();
  };

  return (
    <form
    noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-sm border border-gray-200 bg-white p-5 shadow-sm"
    >
      <h1 className="text-xl font-semibold text-gray-900">Create post</h1>

      {/* Title */}
      <div className="space-y-1">
        <label className="text-sm text-gray-700">Title</label>
        <input
          {...register("title")}
          placeholder="Post title"
          className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
        />
        {errors.title && (
          <p className="text-xs text-red-500">{errors.title.message}</p>
        )}
      </div>

      {/* Body */}
      <div className="space-y-1">
        <label className="text-sm text-gray-700">Body</label>
        <textarea
          {...register("body")}
          placeholder="Write something..."
          className="min-h-28 w-full rounded-sm border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
        />
        {errors.body && (
          <p className="text-xs text-red-500">{errors.body.message}</p>
        )}
      </div>

      {/* Images */}
      <div className="space-y-2">
        <label className="text-sm text-gray-700">Images</label>

        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((image, index) => (
              <div key={`${image.name}-${index}`} className="group relative h-24 w-24">
                <img
                  src={URL.createObjectURL(image)}
                  alt={image.name}
                  className="h-full w-full rounded-sm border border-gray-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  x
                </button>
                <p className="mt-0.5 w-24 truncate text-xs text-gray-500">
                  {image.name}
                </p>
              </div>
            ))}
          </div>
        )}

        <label className="flex cursor-pointer items-center gap-2 self-start rounded-sm border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
          + Add images
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => addImages(e.target.files)}
          />
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="rounded-sm bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {loading ? "Posting..." : "Post"}
      </button>
    </form>
  );
}
