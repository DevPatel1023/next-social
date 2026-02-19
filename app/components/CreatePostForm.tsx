"use client";

import { useRouter } from "next/navigation";
import { usePostStore } from "@/app/store/post.store";
import { toast } from "react-toastify";

export default function CreatePostForm() {
  const router = useRouter();
  const title = usePostStore((state) => state.createTitle);
  const body = usePostStore((state) => state.createBody);
  const images = usePostStore((state) => state.createImages);
  const loading = usePostStore((state) => state.createLoading);
  const setTitle = usePostStore((state) => state.setCreateTitle);
  const setBody = usePostStore((state) => state.setCreateBody);
  const addImages = usePostStore((state) => state.addCreateImages);
  const removeImage = usePostStore((state) => state.removeCreateImage);
  const submitCreatePost = usePostStore((state) => state.submitCreatePost);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // post cannot be empty if it has no title, body, or images
    if(!title.trim() && !body.trim() && images.length === 0) {
      toast.error("Post cannot be empty");
      return;
    }

    const result = await submitCreatePost();

    if (result.error) {
      // error toast
      toast.error("Failed to create post: " + result.error);
      return;
    }

    // if successful, show success toast and redirect to feed
    toast.success("Post created successfully!");
    // navigate to feed and refresh to show the new post
    router.push("/feed");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-sm border border-gray-200 bg-white p-5 shadow-sm">
      <h1 className="text-xl font-semibold text-gray-900">Create post</h1>


      <div className="space-y-1">
        <label className="text-sm text-gray-700">Title</label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Post title"
          className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-gray-700">Body</label>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write something..."
          className="min-h-28 w-full rounded-sm border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-gray-700">Images</label>

        {images.length > 0 ? (
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
                <p className="mt-0.5 w-24 truncate text-xs text-gray-500">{image.name}</p>
              </div>
            ))}
          </div>
        ) : null}

        <label className="flex cursor-pointer items-center gap-2 self-start rounded-sm border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
          + Add images
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => addImages(event.target.files)}
          />
        </label>
      </div>

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
