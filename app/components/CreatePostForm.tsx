"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreatePostForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addImages = (files: FileList | null) => {
    if (!files) return;
    setImages((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      const incoming = Array.from(files).filter((f) => !existing.has(f.name + f.size));
      return [...prev, ...incoming];
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("body", body);
      for (const image of images) {
        formData.append("images", image);
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Could not create post");
        return;
      }

      router.push("/feed");
      router.refresh();
    } catch {
      setError("Could not create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-sm border border-gray-200 bg-white p-5 shadow-sm">
      <h1 className="text-xl font-semibold text-gray-900">Create post</h1>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

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
              <div key={index} className="group relative h-24 w-24">
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
                  ✕
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