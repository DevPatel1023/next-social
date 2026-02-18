"use client";

import { create } from "zustand";

type PostComment = {
  id: string;
  author: string;
  text: string;
};

type PostUIState = {
  comments: PostComment[];
  commentText: string;
  isSubmittingComment: boolean;
  isDeletingPost: boolean;
  error: string | null;
  visibleComments: number;
};

type PostStore = {
  createTitle: string;
  createBody: string;
  createImages: File[];
  createLoading: boolean;
  createError: string | null;
  visiblePostsByKey: Record<string, number>;
  postUIById: Record<string, PostUIState>;
  setCreateTitle: (value: string) => void;
  setCreateBody: (value: string) => void;
  addCreateImages: (files: FileList | null) => void;
  removeCreateImage: (index: number) => void;
  resetCreateForm: () => void;
  submitCreatePost: () => Promise<{ error: string | null }>;
  ensureVisiblePosts: (key: string) => void;
  loadMorePosts: (key: string) => void;
  initPostUI: (postId: string, initialComments: PostComment[]) => void;
  setCommentText: (postId: string, text: string) => void;
  loadMoreComments: (postId: string) => void;
  submitComment: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<boolean>;
};

const defaultPostUI = (comments: PostComment[]): PostUIState => ({
  comments,
  commentText: "",
  isSubmittingComment: false,
  isDeletingPost: false,
  error: null,
  visibleComments: 3,
});

export const usePostStore = create<PostStore>((set, get) => ({
  createTitle: "",
  createBody: "",
  createImages: [],
  createLoading: false,
  createError: null,
  visiblePostsByKey: {},
  postUIById: {},

  setCreateTitle: (value) => set({ createTitle: value }),
  setCreateBody: (value) => set({ createBody: value }),

  addCreateImages: (files) => {
    if (!files) return;
    set((state) => {
      const existing = new Set(state.createImages.map((file) => `${file.name}-${file.size}`));
      const incoming = Array.from(files).filter(
        (file) => !existing.has(`${file.name}-${file.size}`),
      );
      return { createImages: [...state.createImages, ...incoming] };
    });
  },

  removeCreateImage: (index) =>
    set((state) => ({
      createImages: state.createImages.filter((_, imageIndex) => imageIndex !== index),
    })),

  resetCreateForm: () =>
    set({
      createTitle: "",
      createBody: "",
      createImages: [],
      createLoading: false,
      createError: null,
    }),

  submitCreatePost: async () => {
    const { createTitle, createBody, createImages } = get();
    set({ createLoading: true, createError: null });

    try {
      const formData = new FormData();
      formData.append("title", createTitle);
      formData.append("body", createBody);
      for (const image of createImages) {
        formData.append("images", image);
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        const error = result.error ?? "Could not create post";
        set({ createError: error });
        return { error };
      }

      get().resetCreateForm();
      return { error: null };
    } catch {
      const error = "Could not create post";
      set({ createError: error });
      return { error };
    } finally {
      set({ createLoading: false });
    }
  },

  ensureVisiblePosts: (key) =>
    set((state) => {
      if (state.visiblePostsByKey[key]) {
        return state;
      }
      return {
        visiblePostsByKey: {
          ...state.visiblePostsByKey,
          [key]: 5,
        },
      };
    }),

  loadMorePosts: (key) =>
    set((state) => ({
      visiblePostsByKey: {
        ...state.visiblePostsByKey,
        [key]: (state.visiblePostsByKey[key] ?? 5) + 5,
      },
    })),

  initPostUI: (postId, initialComments) =>
    set((state) => {
      if (state.postUIById[postId]) {
        return state;
      }
      return {
        postUIById: {
          ...state.postUIById,
          [postId]: defaultPostUI(initialComments),
        },
      };
    }),

  setCommentText: (postId, text) =>
    set((state) => {
      const current = state.postUIById[postId] ?? defaultPostUI([]);
      return {
        postUIById: {
          ...state.postUIById,
          [postId]: {
            ...current,
            commentText: text,
          },
        },
      };
    }),

  loadMoreComments: (postId) =>
    set((state) => {
      const current = state.postUIById[postId] ?? defaultPostUI([]);
      return {
        postUIById: {
          ...state.postUIById,
          [postId]: {
            ...current,
            visibleComments: current.visibleComments + 3,
          },
        },
      };
    }),

  submitComment: async (postId) => {
    const current = get().postUIById[postId] ?? defaultPostUI([]);
    const trimmed = current.commentText.trim();
    if (!trimmed || current.isSubmittingComment) {
      return;
    }

    set((state) => ({
      postUIById: {
        ...state.postUIById,
        [postId]: {
          ...(state.postUIById[postId] ?? defaultPostUI([])),
          isSubmittingComment: true,
          error: null,
        },
      },
    }));

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, text: trimmed }),
      });
      const result = (await response.json()) as {
        error?: string;
        comment?: PostComment;
      };

      if (!response.ok || !result.comment) {
        set((state) => ({
          postUIById: {
            ...state.postUIById,
            [postId]: {
              ...(state.postUIById[postId] ?? defaultPostUI([])),
              isSubmittingComment: false,
              error: result.error ?? "Could not post comment",
            },
          },
        }));
        return;
      }

      set((state) => {
        const next = state.postUIById[postId] ?? defaultPostUI([]);
        return {
          postUIById: {
            ...state.postUIById,
            [postId]: {
              ...next,
              comments: [...next.comments, result.comment],
              commentText: "",
              isSubmittingComment: false,
              error: null,
            },
          },
        };
      });
    } catch {
      set((state) => ({
        postUIById: {
          ...state.postUIById,
          [postId]: {
            ...(state.postUIById[postId] ?? defaultPostUI([])),
            isSubmittingComment: false,
            error: "Could not post comment",
          },
        },
      }));
    }
  },

  deletePost: async (postId) => {
    const current = get().postUIById[postId] ?? defaultPostUI([]);
    if (current.isDeletingPost) {
      return false;
    }

    set((state) => ({
      postUIById: {
        ...state.postUIById,
        [postId]: {
          ...(state.postUIById[postId] ?? defaultPostUI([])),
          isDeletingPost: true,
          error: null,
        },
      },
    }));

    try {
      const response = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        set((state) => ({
          postUIById: {
            ...state.postUIById,
            [postId]: {
              ...(state.postUIById[postId] ?? defaultPostUI([])),
              isDeletingPost: false,
              error: result.error ?? "Could not delete post",
            },
          },
        }));
        return false;
      }

      set((state) => ({
        postUIById: {
          ...state.postUIById,
          [postId]: {
            ...(state.postUIById[postId] ?? defaultPostUI([])),
            isDeletingPost: false,
            error: null,
          },
        },
      }));
      return true;
    } catch {
      set((state) => ({
        postUIById: {
          ...state.postUIById,
          [postId]: {
            ...(state.postUIById[postId] ?? defaultPostUI([])),
            isDeletingPost: false,
            error: "Could not delete post",
          },
        },
      }));
      return false;
    }
  },
}));
