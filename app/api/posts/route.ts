import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const POST_IMAGES_BUCKET = "post-images";

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

async function uploadImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  image: File,
) {
  const bytes = await image.arrayBuffer();
  const extension = image.name.includes(".")
    ? image.name.split(".").pop()?.toLowerCase() || "jpg"
    : "jpg";
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const { error } = await supabase.storage.from(POST_IMAGES_BUCKET).upload(fileName, bytes, {
    contentType: image.type || "image/jpeg",
    upsert: false,
  });

  if (error) return { error: error.message, imagePath: "" };

  return { error: "", imagePath: `${POST_IMAGES_BUCKET}/${fileName}` };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const title = normalizeText(formData.get("title"));
  const body = normalizeText(formData.get("body"));
  const images = formData
    .getAll("images")
    .filter((item): item is File => item instanceof File && item.size > 0);

  if (!title || !body) {
    return NextResponse.json({ error: "title and body are required." }, { status: 400 });
  }

  const imagePaths: string[] = [];
  for (const image of images) {
    if (image.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Image is too large (max 10MB)." }, { status: 400 });
    }
    const uploaded = await uploadImage(supabase, user.id, image);
    if (uploaded.error) {
      return NextResponse.json({ error: uploaded.error }, { status: 400 });
    }
    imagePaths.push(uploaded.imagePath);
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({ user_id: user.id, title, body, images: imagePaths })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true, id: data?.id }, { status: 200 });
}