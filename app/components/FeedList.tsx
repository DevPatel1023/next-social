"use client";

import { useState } from "react";
import Post from "@/app/components/Post";
import type { SocialPost } from "@/app/lib/social";

type FeedListProps = {
  posts: SocialPost[];
  emptyMessage: string;
  paginated?: boolean;
  canDeletePosts?: boolean;
};

export default function FeedList({
  posts,
  emptyMessage,
  paginated = true,
  canDeletePosts = false,
}: FeedListProps) {
  const [visiblePosts, setVisiblePosts] = useState(5);
  const renderedPosts = paginated ? posts.slice(0, visiblePosts) : posts;

  if (posts.length === 0) {
    return (
      <div className="rounded-sm border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {renderedPosts.map((post) => (
        <Post
          key={post.id}
          id={post.id}
          author={post.author}
          title={post.title}
          body={post.body}
          images={post.images}
          initialComments={post.comments}
          canDelete={canDeletePosts}
        />
      ))}

      {paginated && posts.length > visiblePosts ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisiblePosts((prev) => prev + 5)}
            className="rounded-sm border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm"
          >
            Load more posts
          </button>
        </div>
      ) : null}
    </>
  );
}
