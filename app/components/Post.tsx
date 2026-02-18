"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePostStore } from "@/app/store/post.store";

export type PostComment = {
  id: string;
  author: string;
  text: string;
};

type PostProps = {
  id: string;
  author: string;
  title?: string;
  body?: string;
  image?: string;
  images?: string[];
  initialComments: PostComment[];
  canDelete?: boolean;
};

export default function Post({
  id,
  author,
  title,
  body,
  image,
  images,
  initialComments,
  canDelete = false,
}: PostProps) {
  const router = useRouter();
  const gallery = images && images.length > 0 ? images : image ? [image] : [];

  const initPostUI = usePostStore((state) => state.initPostUI);
  const setCommentText = usePostStore((state) => state.setCommentText);
  const submitComment = usePostStore((state) => state.submitComment);
  const loadMoreComments = usePostStore((state) => state.loadMoreComments);
  const deletePost = usePostStore((state) => state.deletePost);
  const postUI = usePostStore((state) => state.postUIById[id]);

  useEffect(() => {
    initPostUI(id, initialComments);
  }, [id, initialComments, initPostUI]);

  const comments = postUI?.comments ?? initialComments;
  const commentText = postUI?.commentText ?? "";
  const isSubmitting = postUI?.isSubmittingComment ?? false;
  const isDeleting = postUI?.isDeletingPost ?? false;
  const error = postUI?.error ?? null;
  const visibleComments = postUI?.visibleComments ?? 3;

  const handleSubmitComment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitComment(id);
  };

  const handleDeletePost = async () => {
    const deleted = await deletePost(id);
    if (deleted) {
      router.refresh();
    }
  };

  return (
    <article className="space-y-4 rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900">@{author}</p>
        {canDelete ? (
          <button
            type="button"
            onClick={handleDeletePost}
            disabled={isDeleting}
            className="rounded-sm border border-red-300 px-2 py-1 text-xs text-red-600 disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        ) : null}
      </div>

      {title ? <h3 className="text-base font-semibold text-gray-900">{title}</h3> : null}
      {body ? <p className="text-sm text-gray-800">{body}</p> : null}

      {gallery.length > 0 ? (
        <div className={gallery.length === 1 ? "space-y-2" : "grid grid-cols-2 gap-2"}>
          {gallery.map((src, index) => (
            <Image
              key={`${src}-${index}`}
              src={src}
              alt={`post image ${index + 1}`}
              width={1000}
              height={750}
              className="h-64 w-full rounded object-cover"
            />
          ))}
        </div>
      ) : null}

      <form onSubmit={handleSubmitComment} className="flex gap-2 pt-1">
        <input
          value={commentText}
          onChange={(event) => setCommentText(id, event.target.value)}
          placeholder="Write a comment"
          className="flex-1 rounded-sm border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-sm bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </form>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <div className="space-y-2 border-t border-gray-100 pt-3">
        {comments.slice(0, visibleComments).map((comment) => (
          <p key={comment.id} className="text-sm text-gray-700">
            <span className="font-medium text-gray-900">{comment.author}: </span>
            {comment.text}
          </p>
        ))}
        {comments.length === 0 ? (
          <p className="text-xs text-gray-500">No comments yet. Be the first one.</p>
        ) : null}
        {comments.length > visibleComments ? (
          <button
            type="button"
            onClick={() => loadMoreComments(id)}
            className="text-xs font-medium text-gray-700 underline underline-offset-2"
          >
            Load more comments
          </button>
        ) : null}
      </div>
    </article>
  );
}
