import { createClient } from "@/app/lib/supabase/server";

type RawRow = Record<string, unknown>;

export type SocialComment = {
  id: string;
  author: string;
  text: string;
};

export type SocialPost = {
  id: string;
  userId: string;
  author: string;
  caption: string;
  images: string[];
  comments: SocialComment[];
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function firstNonEmptyString(values: unknown[]) {
  for (const value of values) {
    const text = asString(value).trim();
    if (text) {
      return text;
    }
  }
  return "";
}

function rowId(value: unknown, fallback: string) {
  const id = asString(value).trim();
  return id || fallback;
}

function parseStringList(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => asString(item).trim())
      .filter((item) => item.length > 0);
  }

  const raw = asString(value).trim();
  if (!raw) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => asString(item).trim())
        .filter((item) => item.length > 0);
    }
  } catch {}

  return [raw];
}

function imageCandidates(row: RawRow) {
  const list = [
    ...parseStringList(row.image_urls),
    ...parseStringList(row.images),
    firstNonEmptyString([row.image_url, row.image, row.photo_url, row.media_url]),
  ].filter((item) => item.length > 0);

  return Array.from(new Set(list));
}

export async function resolveImageSource(
  supabase: Awaited<ReturnType<typeof createClient>>,
  raw: string,
) {
  const value = raw.trim();
  if (!value) {
    return "";
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("/")
  ) {
    return value;
  }

  const attempts: Array<{ bucket: string; path: string }> = [];
  const slashIndex = value.indexOf("/");
  if (slashIndex > 0 && slashIndex < value.length - 1) {
    attempts.push({
      bucket: value.slice(0, slashIndex),
      path: value.slice(slashIndex + 1),
    });
  }

  for (const bucket of ["posts", "post-images", "images", "uploads", "media"]) {
    attempts.push({ bucket, path: value });
  }
  const envBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim();
  if (envBucket) {
    attempts.push({ bucket: envBucket, path: value });
  }

  for (const attempt of attempts) {
    const { data } = supabase.storage.from(attempt.bucket).getPublicUrl(attempt.path);
    const publicUrl = asString(data?.publicUrl).trim();
    if (publicUrl) {
      return publicUrl;
    }
  }

  return "";
}

async function resolvePostImages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  row: RawRow,
) {
  const candidates = imageCandidates(row);
  const resolved = await Promise.all(
    candidates.map((candidate) => resolveImageSource(supabase, candidate)),
  );
  return Array.from(new Set(resolved.filter((url) => url.length > 0)));
}

export async function loadPostsWithComments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  options?: { userId?: string; fallbackUsername?: string },
) {
  let postsQuery = supabase.from("posts").select("*").order("created_at", { ascending: false });
  if (options?.userId) {
    postsQuery = postsQuery.eq("user_id", options.userId);
  }

  const { data: rawPosts } = await postsQuery;
  const posts = ((rawPosts ?? []) as RawRow[]).filter((post) => !!post.id);
  const postIds = posts.map((post) => asString(post.id)).filter((id) => id.length > 0);

  const { data: rawComments } = postIds.length
    ? await supabase
        .from("comments")
        .select("*")
        .in("post_id", postIds)
        .order("created_at", { ascending: true })
    : { data: [] as RawRow[] };

  const comments = (rawComments ?? []) as RawRow[];

  const userIds = new Set<string>();
  for (const post of posts) {
    const postUserId = asString(post.user_id);
    if (postUserId) {
      userIds.add(postUserId);
    }
  }
  for (const comment of comments) {
    const commentUserId = asString(comment.user_id);
    if (commentUserId) {
      userIds.add(commentUserId);
    }
  }

  const { data: rawUsers } = userIds.size
    ? await supabase.from("users").select("id, username").in("id", Array.from(userIds))
    : { data: [] as RawRow[] };

  const usernameById = new Map<string, string>();
  for (const userRow of (rawUsers ?? []) as RawRow[]) {
    const id = asString(userRow.id);
    const username = asString(userRow.username);
    if (id && username) {
      usernameById.set(id, username);
    }
  }

  const commentsByPostId = new Map<string, SocialComment[]>();
  for (const comment of comments) {
    const postId = asString(comment.post_id);
    if (!postId) {
      continue;
    }

    const text = firstNonEmptyString([comment.content, comment.text, comment.body, comment.comment]);
    if (!text) {
      continue;
    }

    const list = commentsByPostId.get(postId) ?? [];
    list.push({
      id: rowId(comment.id, `${postId}-${list.length}`),
      author: usernameById.get(asString(comment.user_id)) ?? "user",
      text,
    });
    commentsByPostId.set(postId, list);
  }

  const mapped: SocialPost[] = await Promise.all(
    posts.map(async (post, index) => {
      const id = rowId(post.id, `post-${index}`);
      const userId = asString(post.user_id);

      return {
        id,
        userId,
        author: usernameById.get(userId) ?? options?.fallbackUsername ?? "user",
        caption: firstNonEmptyString([post.caption, post.content, post.text, post.body]),
        images: await resolvePostImages(supabase, post),
        comments: commentsByPostId.get(id) ?? [],
      };
    }),
  );

  return mapped;
}
